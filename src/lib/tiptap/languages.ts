export type CodeBlockLanguageOption = {
  value: string;
  label: string;
};

export const CODE_BLOCK_LANGUAGES: CodeBlockLanguageOption[] = [
  { value: '', label: 'Auto' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'xml', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'plaintext', label: 'Plain text' },
];

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  html: 'xml',
  sh: 'bash',
  shell: 'bash',
  py: 'python',
};

export function canonicalCodeBlockLanguage(language: string | null | undefined): string {
  if (!language) return '';
  return LANGUAGE_ALIASES[language] ?? language;
}

export function codeBlockLanguageOptions(current: string): CodeBlockLanguageOption[] {
  const canonical = canonicalCodeBlockLanguage(current);

  if (canonical && !CODE_BLOCK_LANGUAGES.some((option) => option.value === canonical)) {
    return [...CODE_BLOCK_LANGUAGES, { value: canonical, label: canonical }];
  }

  return CODE_BLOCK_LANGUAGES;
}
