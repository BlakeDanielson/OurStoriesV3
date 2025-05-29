'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Calendar } from 'lucide-react'
import type { ChildProfileFormData } from '@/lib/validations/child-profile'

export function BasicInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<ChildProfileFormData>()

  const nameValue = watch('name')
  const ageValue = watch('age')

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = value === '' ? 0 : parseInt(value, 10)
    if (!isNaN(numValue)) {
      setValue('age', numValue, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Let's start with the basics</h3>
        <p className="text-muted-foreground">
          Tell us your child's name and age so we can create personalized
          stories just for them.
        </p>
      </div>

      <div className="grid gap-6 max-w-md mx-auto">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Child's Name</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your child's name"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <Alert variant="destructive">
              <AlertDescription>{errors.name.message}</AlertDescription>
            </Alert>
          )}
          {nameValue && nameValue.length > 0 && !errors.name && (
            <p className="text-sm text-muted-foreground">
              Great! We'll create stories featuring {nameValue}.
            </p>
          )}
        </div>

        {/* Age Field */}
        <div className="space-y-2">
          <Label htmlFor="age" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Age</span>
          </Label>
          <Input
            id="age"
            type="number"
            min="0"
            max="18"
            placeholder="Enter age"
            value={ageValue || ''}
            onChange={handleAgeChange}
            className={errors.age ? 'border-destructive' : ''}
          />
          {errors.age && (
            <Alert variant="destructive">
              <AlertDescription>{errors.age.message}</AlertDescription>
            </Alert>
          )}
          {ageValue > 0 && !errors.age && (
            <p className="text-sm text-muted-foreground">
              Perfect! We'll tailor the stories for a {ageValue}-year-old.
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          This information helps us create age-appropriate content and
          personalized adventures.
        </p>
      </div>
    </div>
  )
}
