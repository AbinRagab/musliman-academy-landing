import { useEffect, useState } from 'react';
import { usePrograms } from '../services/programsService';

type ProgramSelectProps = {
  value?: string | null;
  onChange?: (value: string) => void;
  label?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  includeAllOption?: boolean;
  allLabel?: string;
  className?: string;
};

export default function ProgramSelect({
  value,
  onChange,
  label,
  name,
  placeholder = 'Select program',
  required = false,
  disabled = false,
  includeAllOption = false,
  allLabel = 'All programs',
  className,
}: ProgramSelectProps) {
  const { loading, error, programs } = usePrograms();
  const [internalValue, setInternalValue] = useState(value || (includeAllOption ? 'all' : ''));
  const selectedValue = onChange ? value || (includeAllOption ? 'all' : '') : internalValue;
  const selectedMissing = Boolean(
    selectedValue
    && selectedValue !== 'all'
    && !loading
    && !error
    && programs.length
    && !programs.some((program) => program.id === selectedValue),
  );

  useEffect(() => {
    if (selectedMissing && import.meta.env.DEV) {
      console.warn(`Selected program_id does not match any active program: ${selectedValue}`);
    }
  }, [selectedMissing, selectedValue]);

  useEffect(() => {
    if (!onChange) {
      setInternalValue(value || (includeAllOption ? 'all' : ''));
    }
  }, [includeAllOption, onChange, value]);

  const select = (
    <select
      className={className}
      name={name}
      value={selectedValue}
      required={required}
      disabled={disabled || loading || Boolean(error) || (!includeAllOption && programs.length === 0)}
      onChange={(event) => {
        setInternalValue(event.target.value);
        onChange?.(event.target.value);
      }}
    >
      {includeAllOption && <option value="all">{allLabel}</option>}
      {!includeAllOption && <option value="">{loading ? 'Loading programs...' : error ? 'Unable to load programs' : programs.length ? placeholder : 'No programs found'}</option>}
      {includeAllOption && loading && <option value="__loading" disabled>Loading programs...</option>}
      {includeAllOption && error && <option value="__error" disabled>Unable to load programs</option>}
      {includeAllOption && !loading && !error && programs.length === 0 && <option value="__empty" disabled>No programs found</option>}
      {selectedMissing && <option value={selectedValue}>Previously selected program</option>}
      {programs.map((program) => (
        <option key={program.id} value={program.id}>{program.name}</option>
      ))}
    </select>
  );

  if (!label) {
    return select;
  }

  return (
    <label>
      <span>{label}</span>
      {select}
    </label>
  );
}
