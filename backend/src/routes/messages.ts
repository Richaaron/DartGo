import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { supabase } from '../config/supabase';
import { authenticateToken } from '../middleware/authSupabase';

const router = Router();
const TABLE_NAME = 'messages';

const fallbackMessages = new Map<string, Record<string, any>>();

const getCurrentUserId = (req: Request) => {
  const authReq = req as Request & { user?: Record<string, any> };

  return authReq.user?.id || authReq.user?.userId || authReq.user?.sub || null;
};

const isTableOrStorageUnavailable = (error: any): boolean => {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '');

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
};

const normalizeMessage = (record: Record<string, any> | null) => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    id: record.id ?? record._id,
    senderId: record.senderId ?? record.sender_id ?? null,
    recipientId: record.recipientId ?? record.recipient_id ?? null,
    createdAt: record.createdAt ?? record.created_at ?? null,
    updatedAt: record.updatedAt ?? record.updated_at ?? null,
  };
};

const getFallbackList = (req: Request) => {
  const { senderId, recipientId } = req.query;
  const currentUserId = getCurrentUserId(req);

  return Array.from(fallbackMessages.values())
    .filter((item) => {
      if (typeof senderId === 'string' && String(item.senderId ?? item.sender_id ?? '') !== senderId) {
        return false;
      }

      if (typeof recipientId === 'string' && String(item.recipientId ?? item.recipient_id ?? '') !== recipientId) {
        return false;
      }

      if (!senderId && !recipientId && currentUserId) {
        const sender = String(item.senderId ?? item.sender_id ?? '');
        const recipient = String(item.recipientId ?? item.recipient_id ?? '');

        return sender === String(currentUserId) || recipient === String(currentUserId);
      }

      return true;
    })
    .map((item) => normalizeMessage(item));
};

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { senderId, recipientId } = req.query;
  const currentUserId = getCurrentUserId(req);

  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (typeof senderId === 'string' && senderId) {
      query = query.eq('sender_id', senderId);
    }

    if (typeof recipientId === 'string' && recipientId) {
      query = query.eq('recipient_id', recipientId);
    }

    const { data, error } = await query;

    if (error) {
      if (isTableOrStorageUnavailable(error)) {
        return res.json(getFallbackList(req));
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch messages' });
    }

    const normalized = (data || []).map((item) => normalizeMessage(item));

    if ((typeof senderId !== 'string' || !senderId) && (typeof recipientId !== 'string' || !recipientId) && currentUserId) {
      return res.json(
        normalized.filter((item) => {
          return String(item?.senderId ?? '') === String(currentUserId) || String(item?.recipientId ?? '') === String(currentUserId);
        })
      );
    }

    return res.json(normalized);
  } catch (error: any) {
    return res.json(getFallbackList(req));
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('id', id).maybeSingle();

    if (error) {
      const fallbackRecord = fallbackMessages.get(id);

      if (!fallbackRecord) {
        return res.status(404).json({ error: 'Message not found' });
      }

      return res.json(normalizeMessage(fallbackRecord));
    }

    if (!data) {
      const fallbackRecord = fallbackMessages.get(id);

      if (!fallbackRecord) {
        return res.status(404).json({ error: 'Message not found' });
      }

      return res.json(normalizeMessage(fallbackRecord));
    }

    return res.json(normalizeMessage(data));
  } catch (error: any) {
    const fallbackRecord = fallbackMessages.get(id);

    if (!fallbackRecord) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json(normalizeMessage(fallbackRecord));
  }
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const senderId = req.body?.senderId ?? req.body?.sender_id ?? getCurrentUserId(req);
  const payload = {
    ...req.body,
    senderId,
    sender_id: senderId,
    created_at: req.body?.created_at ?? now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();

    if (error) {
      const record = {
        id: payload.id ?? uuidv4(),
        ...payload,
      };

      fallbackMessages.set(String(record.id), record);

      return res.status(201).json(normalizeMessage(record));
    }

    return res.status(201).json(normalizeMessage(data));
  } catch (error: any) {
    const record = {
      id: payload.id ?? uuidv4(),
      ...payload,
    };

    fallbackMessages.set(String(record.id), record);

    return res.status(201).json(normalizeMessage(record));
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = {
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from(TABLE_NAME).update(payload).eq('id', id).select().maybeSingle();

    if (error) {
      const existing = fallbackMessages.get(id);

      if (!existing) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const updated = {
        ...existing,
        ...payload,
        id,
      };

      fallbackMessages.set(id, updated);

      return res.json(normalizeMessage(updated));
    }

    if (!data) {
      const existing = fallbackMessages.get(id);

      if (!existing) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const updated = {
        ...existing,
        ...payload,
        id,
      };

      fallbackMessages.set(id, updated);

      return res.json(normalizeMessage(updated));
    }

    return res.json(normalizeMessage(data));
  } catch (error: any) {
    const existing = fallbackMessages.get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updated = {
      ...existing,
      ...payload,
      id,
    };

    fallbackMessages.set(id, updated);

    return res.json(normalizeMessage(updated));
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase.from(TABLE_NAME).delete().eq('id', id).select().maybeSingle();

    if (error) {
      const deleted = fallbackMessages.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Message not found' });
      }

      return res.json({ message: 'Message deleted' });
    }

    if (!data) {
      const deleted = fallbackMessages.delete(id);

      if (!deleted) {
        return res.status(404).json({ error: 'Message not found' });
      }
    }

    return res.json({ message: 'Message deleted' });
  } catch (error: any) {
    const deleted = fallbackMessages.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json({ message: 'Message deleted' });
  }
});

export default router;