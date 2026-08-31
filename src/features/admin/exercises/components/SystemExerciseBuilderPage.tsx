'use client';

import { useTranslations } from 'next-intl';
import AdminGate from '@/features/admin/components/AdminGate';
import ExerciseBuilderPage from '@/features/exercises/builder/components/ExerciseBuilderPage';

type Props = { exerciseId?: string };

export default function SystemExerciseBuilderPage({ exerciseId }: Props) {
  const t = useTranslations('AdminSystemExerciseBuilderPage');
  const backHref = exerciseId ? `/admin/exercises/${exerciseId}` : '/admin/exercises';

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <ExerciseBuilderPage
        exerciseId={exerciseId}
        variant='admin'
        backLink={{ href: backHref, label: exerciseId ? t('backToExercise') : t('backToList') }}
        cancelHref={backHref}
        visibilityLabels={{ label: t('publicationLabel'), falseLabel: t('draft'), trueLabel: t('published') }}
        toastMessages={{ createSuccess: t('createSuccess'), updateSuccess: t('updateSuccess'), deleteSuccess: t('deleteSuccess') }}
      />
    </AdminGate>
  );
}
