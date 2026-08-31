'use client';

import { useTranslations } from 'next-intl';
import AdminGate from '@/features/admin/components/AdminGate';
import QuestionBuilderPage from '@/features/theory/builder/components/QuestionBuilderPage';
import { adminQuestionApiLayer } from '@/features/theory/builder/hooks/useQuestionBuilderForm';

type Props = { questionId?: string };

export default function SystemQuestionBuilderPage({ questionId }: Props) {
  const t = useTranslations('AdminSystemQuestionBuilderPage');
  const backHref = questionId ? `/admin/questions/${questionId}` : '/admin/questions';

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <QuestionBuilderPage
        questionId={questionId}
        apiLayer={adminQuestionApiLayer}
        backLink={{ href: backHref, label: questionId ? t('backToQuestion') : t('backToList') }}
        cancelHref={backHref}
        visibilityLabels={{ label: t('publicationLabel'), falseLabel: t('draft'), trueLabel: t('published') }}
        toastMessages={{ createSuccess: t('createSuccess'), updateSuccess: t('updateSuccess'), deleteSuccess: t('deleteSuccess') }}
      />
    </AdminGate>
  );
}
