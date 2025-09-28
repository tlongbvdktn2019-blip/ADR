import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  hideRequired?: boolean // Ẩn dấu * khi có required prop
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, hideRequired, ...props }, ref) => {
    const inputClasses = clsx(
      'form-input',
      error && 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
      className
    )

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {props.required && !hideRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          className={inputClasses}
          ref={ref}
          {...props}
        />
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

Input.displayName = 'Input'

export default Input


