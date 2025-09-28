import { SelectHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface SimpleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
}

const SimpleSelect = forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, label, error, helperText, children, ...props }, ref) => {
    const selectClasses = clsx(
      'form-input pr-10 appearance-none bg-white',
      error && 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500',
      className
    )

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            className={selectClasses}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

SimpleSelect.displayName = 'SimpleSelect'

export default SimpleSelect

