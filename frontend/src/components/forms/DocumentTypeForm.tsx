import React from 'react'
import { FormInput } from '../common/FormInput'

interface DocumentTypeFormData {
  name: string
  description: string
  requirements: string
  processing_days: number
  fee: number
  is_active: boolean
}

interface DocumentTypeFormProps {
  data: DocumentTypeFormData
  updateData: (data: Partial<DocumentTypeFormData>) => void
}

// Step 1: Basic Information
const BasicInfoStep: React.FC<DocumentTypeFormProps> = ({ data, updateData }) => {
  const validateName = (value: string | number) => {
    const strValue = String(value)
    if (!strValue || !strValue.trim()) return 'Document name is required'
    if (strValue.length < 3) return 'Document name must be at least 3 characters'
    return null
  }

  const validateDescription = (value: string | number) => {
    const strValue = String(value)
    if (!strValue || !strValue.trim()) return 'Description is required'
    if (strValue.length < 10) return 'Description must be at least 10 characters'
    return null
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
        <h4 className="text-sm font-medium text-blue-900 mb-1">📋 Basic Information</h4>
        <p className="text-xs text-blue-700">
          Provide the essential details for this document type. This information will be visible to residents.
        </p>
      </div>

      <FormInput
        label="Document Name"
        type="text"
        value={data.name}
        onChange={(value) => updateData({ name: value as string })}
        placeholder="e.g., Barangay Clearance, Certificate of Residency"
        required
        validation={validateName}
        helpText="Choose a clear, descriptive name that residents will understand"
      />

      <FormInput
        label="Description"
        type="textarea"
        value={data.description}
        onChange={(value) => updateData({ description: value as string })}
        placeholder="Describe what this document is used for and when residents might need it..."
        required
        rows={4}
        validation={validateDescription}
        helpText="Provide a detailed description to help residents understand the purpose"
      />
    </div>
  )
}

// Step 2: Requirements
const RequirementsStep: React.FC<DocumentTypeFormProps> = ({ data, updateData }) => {
  const validateRequirements = (value: string | number) => {
    const strValue = String(value)
    if (!strValue || !strValue.trim()) return 'At least one requirement is needed'
    const requirements = strValue.split(',').map(req => req.trim()).filter(req => req)
    if (requirements.length === 0) return 'Please provide at least one valid requirement'
    return null
  }

  const addRequirement = (requirement: string) => {
    const currentRequirements = data.requirements ? data.requirements.split(',').map(r => r.trim()) : []
    const newRequirements = [...currentRequirements, requirement].filter(r => r)
    updateData({ requirements: newRequirements.join(', ') })
  }

  const commonRequirements = [
    'Valid ID',
    'Proof of Residency',
    'Application Form',
    'Birth Certificate',
    'Marriage Certificate',
    'Tax Declaration',
    'Utility Bill',
    'Barangay ID'
  ]

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
        <h4 className="text-sm font-medium text-green-900 mb-1">📄 Required Documents</h4>
        <p className="text-xs text-green-700">
          Specify what documents residents need to provide. You can add multiple requirements separated by commas.
        </p>
      </div>

      <FormInput
        label="Requirements"
        type="textarea"
        value={data.requirements}
        onChange={(value) => updateData({ requirements: value as string })}
        placeholder="Valid ID, Proof of Residency, Application Form"
        required
        rows={4}
        validation={validateRequirements}
        helpText="Separate multiple requirements with commas"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Add Common Requirements
        </label>
        <div className="grid grid-cols-2 gap-2">
          {commonRequirements.map((req) => (
            <button
              key={req}
              type="button"
              onClick={() => addRequirement(req)}
              className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-left"
            >
              + {req}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Step 3: Processing Details
const ProcessingStep: React.FC<DocumentTypeFormProps> = ({ data, updateData }) => {
  const validateProcessingDays = (value: string | number) => {
    const numValue = Number(value)
    if (isNaN(numValue)) return 'Processing days must be a valid number'
    if (numValue < 1) return 'Processing days must be at least 1'
    if (numValue > 30) return 'Processing days should not exceed 30'
    return null
  }

  const validateFee = (value: string | number) => {
    const numValue = Number(value)
    if (isNaN(numValue)) return 'Fee must be a valid number'
    if (numValue < 0) return 'Fee cannot be negative'
    if (numValue > 10000) return 'Fee seems unusually high'
    return null
  }

  return (
    <div className="space-y-3">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
        <h4 className="text-sm font-medium text-yellow-900 mb-1">⏱️ Processing Information</h4>
        <p className="text-xs text-yellow-700">
          Set the processing time and fees for this document type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormInput
          label="Processing Days"
          type="number"
          value={data.processing_days}
          onChange={(value) => updateData({ processing_days: value as number })}
          min={1}
          max={30}
          required
          validation={validateProcessingDays}
          helpText="How many business days to process this document"
        />

        <FormInput
          label="Processing Fee (₱)"
          type="number"
          value={data.fee}
          onChange={(value) => updateData({ fee: value as number })}
          min={0}
          step={0.01}
          required
          validation={validateFee}
          helpText="Fee charged for processing this document"
        />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={data.is_active}
            onChange={(e) => updateData({ is_active: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Make this document type available to residents
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Uncheck to temporarily disable this document type
        </p>
      </div>
    </div>
  )
}

// Step 4: Review
const ReviewStep: React.FC<DocumentTypeFormProps> = ({ data }) => {
  const requirements = data.requirements ? data.requirements.split(',').map(r => r.trim()) : []

  return (
    <div className="space-y-3">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
        <h4 className="text-sm font-medium text-purple-900 mb-1">✅ Review & Confirm</h4>
        <p className="text-xs text-purple-700">
          Please review all the information before creating this document type.
        </p>
      </div>

      <div className="space-y-2">
        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <h5 className="font-medium text-gray-900 mb-1">Document Information</h5>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Name:</span>
              <span className="ml-2 text-gray-900">{data.name || 'Not specified'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Description:</span>
              <p className="ml-2 text-gray-900 mt-1">{data.description || 'No description provided'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <h5 className="font-medium text-gray-900 mb-1">Requirements</h5>
          <ul className="text-sm text-gray-900 space-y-1">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-2">
          <h5 className="font-medium text-gray-900 mb-1">Processing Details</h5>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Processing Time:</span>
              <span className="ml-2 text-gray-900">{data.processing_days || 0} business days</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Fee:</span>
              <span className="ml-2 text-gray-900">₱{(data.fee || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                data.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {data.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { BasicInfoStep, RequirementsStep, ProcessingStep, ReviewStep }
export type { DocumentTypeFormData }
