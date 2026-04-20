# NERDC Curriculum Import - Quick Start Guide

## What I've Created

A complete system to import your NERDC scheme of work from the PDF files into the application:

### 📁 Folder Structure
```
nerdc-curriculum-data/
├── INSTRUCTIONS.md          ← Detailed guide
├── pre-primary/             ← Pre-Nursery and Nursery
│   └── Numeracy.json        ← Example file
├── primary/                 ← Primary 1-6
│   └── Mathematics.json     ← Example file
└── secondary/               ← JSS 1-3 and SSS 1-3
    └── Mathematics.json     ← Example file
```

## How to Use

### Step 1: Extract Data from PDFs
- Open your NERDC PDF files
- Copy the scheme of work content for each subject

### Step 2: Fill the Template Files

Edit the JSON files in each folder following this structure:

```json
{
  "subjectName": "Subject Name",
  "subjectCode": "CODE-XX",
  "level": "Level (Pre-Nursery, Nursery, Primary, or Secondary)",
  "creditUnits": 2,
  "subjectCategory": "CORE or ELECTIVE",
  "topics": [
    {
      "weekNumber": 1,
      "topicName": "Topic Name",
      "objectives": ["Objective 1", "Objective 2"],
      "duration": 30,
      "resources": ["Resource 1", "Resource 2"],
      "assessmentMethod": "How to assess"
    }
  ]
}
```

### Step 3: Run the Import

Open terminal and run:

```bash
cd server
npm run import-nerdc
```

This will:
- ✅ Read all JSON files from the folders
- ✅ Create/update subjects
- ✅ Generate scheme of work for all classes and terms
- ✅ Show import summary

## File Naming Convention

Create files named after subjects:
- `Mathematics.json`
- `English-Language.json` (use hyphens for multi-word)
- `Physics.json`
- `Chemistry.json`
- etc.

## Levels and Default Classes

### Pre-Primary
- Pre-Nursery A, Pre-Nursery B
- Nursery A, Nursery B, Nursery C

### Primary (Primary 1-6)
- Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6

### Secondary
- JSS 1A, JSS 1B, JSS 2A, JSS 2B, JSS 3A, JSS 3B
- SSS 1A, SSS 1B, SSS 2A, SSS 2B, SSS 3A, SSS 3B

## Example Files

Three template files are provided:
1. **pre-primary/Numeracy.json** - Pre-Nursery numeracy with 13 weeks
2. **primary/Mathematics.json** - Primary mathematics with 13 weeks
3. **secondary/Mathematics.json** - Secondary mathematics with 13 weeks

Use these as guides when creating your own files.

## Required Fields

Every topic MUST have:
- ✓ weekNumber (number)
- ✓ topicName (string)
- ✓ objectives (array of strings)
- ✓ duration (number in minutes)
- ✓ resources (array of strings)
- ✓ assessmentMethod (string)

## Troubleshooting

**Error: "Invalid data in file"**
- Check that all required fields are present
- Ensure proper JSON formatting

**Error: "No curriculum found"**
- Ensure level matches exactly: "Pre-Nursery", "Nursery", "Primary", or "Secondary"
- Check INSTRUCTIONS.md for correct level names

**File not imported**
- Make sure file is in correct folder (pre-primary/primary/secondary)
- File must be named `SubjectName.json`
- Must be valid JSON format

## Testing the Import

After running `npm run import-nerdc`:

1. Check database shows new subjects:
   - Login as admin
   - Go to Curriculum Manager
   - Verify subjects are listed

2. View scheme of work:
   - Go to Scheme of Work Manager
   - Select subject and class
   - Verify topics are correctly imported

## Important Notes

- ⚠️ Import will **delete old scheme of work** for subjects being imported
- ✅ Subjects are updated if they already exist
- ✅ Scheme of work is created for all classes and all 3 terms automatically
- ✅ All changes are saved to MongoDB

## Next Steps

1. Copy content from NERDC PDFs
2. Create JSON files in appropriate folders
3. Run `npm run import-nerdc`
4. Verify in the application UI
5. Done! Your curriculum is now set up

---

**Need Help?** Check `nerdc-curriculum-data/INSTRUCTIONS.md` for detailed information.
