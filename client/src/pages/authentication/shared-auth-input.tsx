import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '../../components/ui/button';
import { FormControl } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import type { SharedAuthInputProps } from '../../types';

export function SharedAuthInput({ field, fd }: SharedAuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  let type = fd.type;
  if (type === 'password' && showPassword) {
    type = 'text';
  }

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPassword]);

  return (
    <FormControl>
      <div className='flex flex-row relative items-center'>
        <Input {...field} {...fd} ref={inputRef} placeholder={fd.label} type={type} />
        {fd.type === 'password' && (
          <Button
            type='button'
            className='bg-white text-black'
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        )}
      </div>
    </FormControl>
  );
}
