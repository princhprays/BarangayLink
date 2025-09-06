import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
  component: React.ReactNode
  validation?: () => boolean
}

interface StepFormProps {
  steps: Step[]
  onComplete: (data: any) => void
  onCancel: () => void
  title: string
  submitText?: string
  className?: string
}

export const StepForm: React.FC<StepFormProps> = ({
  steps,
  onComplete,
  onCancel,
  title,
  submitText = 'Complete',
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    // Validate current step if validation function exists
    if (currentStepData.validation && !currentStepData.validation()) {
      return
    }

    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]))

    if (isLastStep) {
      onComplete(formData)
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const updateFormData = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) return 'completed'
    if (stepIndex === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          Step {currentStep + 1} of {steps.length}: {currentStepData.title}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index)
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'current'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {status === 'completed' ? (
                      <Check className="w-2 h-2" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="ml-1">
                    <p
                      className={`text-xs font-medium ${
                        status === 'current' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900 mb-1">
            {currentStepData.title}
          </h3>
          {currentStepData.description && (
            <p className="text-xs text-gray-600">{currentStepData.description}</p>
          )}
        </div>

        <div className="min-h-[120px]">
          {React.cloneElement(currentStepData.component as React.ReactElement, {
            data: formData,
            updateData: updateFormData
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex justify-between flex-shrink-0 bg-white">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>

        <div className="flex space-x-3">
          {!isFirstStep && (
            <button
              type="button"
              onClick={handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                {submitText}
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
