'use client';

import Link from 'next/link';
import { Icon } from './icons';
import type { ProjectSummary } from '@/lib/types';

interface Props {
  project: ProjectSummary;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000; // seconds
  if (diff < 60) return 'przed chwilą';
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h temu`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} dni temu`;
  return d.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ProjectCard({ project }: Props) {
  return (
    <Link href={`/projects/${project.id}`} className="project-card">
      <div className="project-card__head">
        <div className="project-card__eyebrow">Projekt</div>
        <div className="project-card__date">{relativeDate(project.updatedAt)}</div>
      </div>
      <h3 className="project-card__title">{project.name}</h3>
      <div className="project-card__meta">
        <span className="project-card__count">
          <Icon.Document className="project-card__icon" />
          {project.documentCount}{' '}
          {project.documentCount === 1 ? 'dokument' : 'dokumentów'}
        </span>
        {project.fileName && (
          <span className="project-card__file" title={project.fileName}>
            {project.fileName}
          </span>
        )}
      </div>
    </Link>
  );
}
