# NERDC Curriculum Data Import Guide

This folder contains templates for organizing NERDC scheme of work data from your PDF files.

## Folder Structure

```
nerdc-curriculum-data/
├── pre-primary/      # Pre-Nursery and Nursery
├── primary/          # Primary 1-6
└── secondary/        # JSS 1-3 and SSS 1-3
```

## How to Use

### Step 1: Extract Data from PDFs
Copy the scheme of work information from your NERDC PDF files and organize it into JSON format.

### Step 2: Create Subject Files
For each subject, create a JSON file named: `{SUBJECT_NAME}.json`

Example: `Mathematics.json`, `English-Language.json`, etc.

### Step 3: Follow JSON Format

```json
{
  "subjectName": "Mathematics",
  "subjectCode": "MTH-PR",
  "level": "Primary",
  "creditUnits": 4,
  "subjectCategory": "CORE",
  "topics": [
    {
      "weekNumber": 1,
      "topicName": "Numbers 1-10",
      "objectives": [
        "Count from 1 to 10",
        "Recognize number symbols",
        "Write numbers 1-10"
      ],
      "duration": 5,
      "resources": [
        "Number cards 1-10",
        "Counting objects",
        "Whiteboard"
      ],
      "assessmentMethod": "Observation and written exercise"
    },
    {
      "weekNumber": 2,
      "topicName": "Addition within 10",
      "objectives": [
        "Understand addition concept",
        "Add numbers within 10",
        "Solve addition problems"
      ],
      "duration": 5,
      "resources": [
        "Counters",
        "Number line",
        "Addition worksheets"
      ],
      "assessmentMethod": "Written test"
    }
  ]
}
```

## Levels and Classes

### Pre-Primary
- Pre-Nursery A, Pre-Nursery B
- Nursery A, Nursery B, Nursery C

### Primary
- Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6

### Secondary
- JSS 1A, JSS 1B, JSS 2A, JSS 2B, JSS 3A, JSS 3B
- SSS 1A, SSS 1B, SSS 2A, SSS 2B, SSS 3A, SSS 3B

## Required Fields

Each topic MUST have:
- `weekNumber` (1-13 or more)
- `topicName` (string)
- `objectives` (array of strings)
- `duration` (number in minutes)
- `resources` (array of strings)
- `assessmentMethod` (string)

## File Naming Convention

- Use hyphens for multi-word subjects: `English-Language.json`, `Social-Studies.json`
- Subject files must be in their appropriate level folder

## Example Files

Check the template files in each folder for complete examples.

## Import Process

After populating the JSON files:

```bash
npm run import-nerdc
```

This will:
1. Read all JSON files from the folders
2. Validate the data format
3. Delete old scheme of work data
4. Insert new NERDC curriculum data
5. Show import summary

## Troubleshooting

- **Validation Error**: Check JSON format - all required fields must be present
- **File not recognized**: Ensure file is in correct folder (pre-primary/primary/secondary)
- **Duplicate data**: Import script automatically clears old data first
