import {
  AlignmentType,
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { GeneratedDocContent } from './types';

export async function generateDocxBuffer(
  doc: GeneratedDocContent,
  opts: { version: number; meta: string }
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: doc.title,
          bold: true,
          size: 56,
        }),
      ],
    })
  );

  // Subtitle
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: doc.subtitle,
          italics: true,
          color: '6B6358',
          size: 22,
        }),
      ],
    })
  );

  // Meta line
  children.push(
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: opts.meta,
          color: '9C9388',
          size: 18,
        }),
      ],
    })
  );

  // Sections
  doc.sections.forEach((section, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 160 },
        children: [
          new TextRun({
            text: `${String(i + 1).padStart(2, '0')}. ${section.heading}`,
            bold: true,
            size: 32,
          }),
        ],
      })
    );

    if (section.body) {
      children.push(
        new Paragraph({
          spacing: { after: 160, line: 320 },
          children: [
            new TextRun({
              text: section.body,
              size: 22,
            }),
          ],
        })
      );
    }

    if (section.bullets) {
      section.bullets.forEach((bullet) => {
        children.push(
          new Paragraph({
            spacing: { after: 80, line: 300 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: bullet,
                size: 22,
              }),
            ],
          })
        );
      });
    }
  });

  // Footer
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: '— koniec dokumentu —',
          color: '9C9388',
          size: 18,
          allCaps: true,
        }),
      ],
    })
  );

  const docx = new DocxDocument({
    creator: 'Klarowit',
    title: doc.title,
    description: doc.subtitle,
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(docx);
}

export function safeFilename(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
    .slice(0, 80);
}
