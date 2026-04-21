import { Request, Response, Router } from 'express';
import { supabase } from '../config/supabase';
import { authenticateToken, requireAdmin } from '../middleware/authSupabase';

const router = Router();

type ConfigObject = Record<string, any>;

let fallbackConfig: ConfigObject = {
  schoolName: '',
  currentTerm: '',
  academicYear: '',
  classes: [],
  terms: [],
};

const isSchemaUnavailableError = (error: any): boolean => {
  if (!error) {
    return false;
  }

  const errorCode = error.code || error?.details?.code;
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();

  return (
    errorCode === '42P01' ||
    errorCode === '42703' ||
    errorCode === 'PGRST204' ||
    errorCode === 'PGRST205' ||
    message.includes('school_config') &&
      (message.includes('not exist') ||
        message.includes('could not find') ||
        message.includes('schema cache') ||
        message.includes('column'))
  );
};

const normalizeConfig = (value: any): ConfigObject => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...fallbackConfig };
  }

  return { ...fallbackConfig, ...value };
};

const extractConfigFromRow = (row: Record<string, any> | null | undefined): ConfigObject => {
  if (!row) {
    return { ...fallbackConfig };
  }

  if (row.config && typeof row.config === 'object' && !Array.isArray(row.config)) {
    return normalizeConfig(row.config);
  }

  const { id, created_at, updated_at, ...rest } = row;
  return normalizeConfig(rest);
};

router.use(authenticateToken);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('school_config').select('*').limit(1);

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.json({ ...fallbackConfig });
      }

      return res.status(500).json({ error: error.message || 'Failed to fetch configuration' });
    }

    if (!data || data.length === 0) {
      return res.json({ ...fallbackConfig });
    }

    const config = extractConfigFromRow(data[0]);
    fallbackConfig = { ...config };

    return res.json(config);
  } catch (error) {
    return res.json({ ...fallbackConfig });
  }
});

router.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'A configuration object is required' });
    }

    const nextConfig = normalizeConfig(req.body);
    fallbackConfig = { ...nextConfig };

    const { data, error } = await supabase
      .from('school_config')
      .upsert(
        {
          id: 'default',
          config: nextConfig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return res.json({ ...fallbackConfig });
      }

      return res.status(500).json({ error: error.message || 'Failed to update configuration' });
    }

    const savedConfig = extractConfigFromRow(data);
    fallbackConfig = { ...savedConfig };

    return res.json(savedConfig);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;