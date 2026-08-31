type VisibilityFieldProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  falseLabel: string;
  trueLabel: string;
  radioName: string;
};

export default function VisibilityField({ value, onChange, label, falseLabel, trueLabel, radioName }: VisibilityFieldProps) {
  return (
    <fieldset className='m-0 mb-6 border-0 p-0'>
      <legend className='mb-1.5 block text-xs text-secondary-foreground'>{label}</legend>
      <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
        <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
          <input type='radio' name={radioName} className='size-3.5 cursor-pointer accent-primary' checked={!value} onChange={() => onChange(false)} />
          {falseLabel}
        </label>
        <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
          <input type='radio' name={radioName} className='size-3.5 cursor-pointer accent-primary' checked={value} onChange={() => onChange(true)} />
          {trueLabel}
        </label>
      </div>
    </fieldset>
  );
}
