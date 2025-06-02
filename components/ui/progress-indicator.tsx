'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  duration?: number
  error?: string
}

interface ProgressIndicatorProps {
  steps: ProgressStep[]
  currentStep?: string
  showEstimatedTime?: boolean
  className?: string
}

export function ProgressIndicator({
  steps,
  currentStep,
  showEstimatedTime = true,
  className = '',
}: ProgressIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [startTime])

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'in-progress':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700'
      case 'error':
        return 'text-red-700'
      case 'in-progress':
        return 'text-blue-700 font-medium'
      default:
        return 'text-gray-500'
    }
  }

  const completedSteps = steps.filter(
    step => step.status === 'completed'
  ).length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const estimatedTotalTime = steps.reduce(
    (total, step) => total + (step.duration || 3000),
    0
  )
  const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime)

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Progress ({completedSteps}/{totalSteps})
          </span>
          {showEstimatedTime && (
            <span className="text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {remainingTime > 0
                ? `~${formatTime(remainingTime)} remaining`
                : 'Almost done'}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
              step.id === currentStep ? 'bg-blue-50 border border-blue-200' : ''
            }`}
          >
            {getStepIcon(step)}
            <div className="flex-1">
              <span className={`text-sm ${getStepColor(step)}`}>
                {step.label}
              </span>
              {step.error && (
                <p className="text-xs text-red-600 mt-1">{step.error}</p>
              )}
            </div>
            {step.status === 'completed' && step.duration && (
              <span className="text-xs text-gray-500">
                {formatTime(step.duration)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook for managing progress steps
export function useProgressSteps(initialSteps: Omit<ProgressStep, 'status'>[]) {
  const [steps, setSteps] = useState<ProgressStep[]>(
    initialSteps.map(step => ({ ...step, status: 'pending' as const }))
  )
  const [currentStep, setCurrentStep] = useState<string | undefined>()

  const updateStep = (
    stepId: string,
    updates: Partial<Pick<ProgressStep, 'status' | 'error' | 'duration'>>
  ) => {
    setSteps(prev =>
      prev.map(step => (step.id === stepId ? { ...step, ...updates } : step))
    )
  }

  const startStep = (stepId: string) => {
    setCurrentStep(stepId)
    updateStep(stepId, { status: 'in-progress' })
  }

  const completeStep = (stepId: string, duration?: number) => {
    updateStep(stepId, { status: 'completed', duration })
    setCurrentStep(undefined)
  }

  const errorStep = (stepId: string, error: string) => {
    updateStep(stepId, { status: 'error', error })
    setCurrentStep(undefined)
  }

  const resetSteps = () => {
    setSteps(prev =>
      prev.map(step => ({
        ...step,
        status: 'pending' as const,
        error: undefined,
      }))
    )
    setCurrentStep(undefined)
  }

  return {
    steps,
    currentStep,
    updateStep,
    startStep,
    completeStep,
    errorStep,
    resetSteps,
  }
}
