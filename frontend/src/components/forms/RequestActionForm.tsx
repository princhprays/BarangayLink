import React, { useState } from 'react'
import { FormInput } from '../common/FormInput'
import { FileUpload } from '../common/FileUpload'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface RequestActionFormData {
  status: 'approved' | 'rejected' | 'completed'
  notes: string
  rejection_reason?: string
  processing_notes?: string
  files?: File[]
}

interface RequestActionFormProps {
  data: RequestActionFormData
  updateData: (data: Partial<RequestActionFormData>) => void
  actionType: 'approve' | 'reject' | 'complete'
  requestDetails?: any
}

export const RequestActionForm: React.FC<RequestActionFormProps> = ({
  data,
  updateData,
  actionType,
  requestDetails
}) => {
  const [files, setFiles] = useState<File[]>([])

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
    updateData({ files: newFiles })
  }

  const getActionIcon = () => {
    switch (actionType) {
      case 'approve':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'reject':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'complete':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    }
  }

  const getActionColor = () => {
    switch (actionType) {
      case 'approve':
        return 'border-green-200 bg-green-50'
      case 'reject':
        return 'border-red-200 bg-red-50'
      case 'complete':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  const getActionTitle = () => {
    switch (actionType) {
      case 'approve':
        return 'Approve Request'
      case 'reject':
        return 'Reject Request'
      case 'complete':
        return 'Complete Request'
      default:
        return 'Process Request'
    }
  }

  const getActionDescription = () => {
    switch (actionType) {
      case 'approve':
        return 'Approve this request and provide any additional processing notes.'
      case 'reject':
        return 'Reject this request and provide a clear reason for rejection.'
      case 'complete':
        return 'Mark this request as completed and add any final notes.'
      default:
        return 'Process this request with the appropriate action.'
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className={`border rounded-lg p-4 ${getActionColor()}`}>
        <div className="flex items-center space-x-3">
          {getActionIcon()}
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {getActionTitle()}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {getActionDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Request Summary */}
      {requestDetails && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Request Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Type:</span>
              <span className="ml-2 text-gray-900">{requestDetails.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Requester:</span>
              <span className="ml-2 text-gray-900">{requestDetails.requester_name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Priority:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                requestDetails.priority === 'high' 
                  ? 'bg-red-100 text-red-800'
                  : requestDetails.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {requestDetails.priority}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <span className="ml-2 text-gray-900">{requestDetails.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action-Specific Fields */}
      {actionType === 'approve' && (
        <FormInput
          label="Processing Notes"
          type="textarea"
          value={data.processing_notes || ''}
          onChange={(value) => updateData({ processing_notes: value as string })}
          placeholder="Add any processing notes or instructions..."
          rows={4}
          helpText="Optional notes about the approval process"
        />
      )}

      {actionType === 'reject' && (
        <FormInput
          label="Rejection Reason"
          type="textarea"
          value={data.rejection_reason || ''}
          onChange={(value) => updateData({ rejection_reason: value as string })}
          placeholder="Please provide a clear reason for rejection..."
          required
          rows={4}
          helpText="Required: Explain why this request is being rejected"
        />
      )}

      {actionType === 'complete' && (
        <FormInput
          label="Completion Notes"
          type="textarea"
          value={data.processing_notes || ''}
          onChange={(value) => updateData({ processing_notes: value as string })}
          placeholder="Add any completion notes or final instructions..."
          rows={4}
          helpText="Optional notes about the completion process"
        />
      )}

      {/* General Notes */}
      <FormInput
        label="Additional Notes"
        type="textarea"
        value={data.notes}
        onChange={(value) => updateData({ notes: value as string })}
        placeholder="Add any additional notes or comments..."
        rows={3}
        helpText="Optional: Any additional information or comments"
      />

      {/* File Upload */}
      <FileUpload
        label="Attach Supporting Documents"
        onFilesChange={handleFilesChange}
        acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
        maxFiles={3}
        maxSize={5}
        helpText="Upload any supporting documents related to this action"
      />

      {/* Action Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Action Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Status will be changed to: <span className="font-medium">{actionType}</span></p>
          {actionType === 'reject' && data.rejection_reason && (
            <p>• Rejection reason: {data.rejection_reason}</p>
          )}
          {data.processing_notes && (
            <p>• Processing notes: {data.processing_notes}</p>
          )}
          {data.notes && (
            <p>• Additional notes: {data.notes}</p>
          )}
          {files.length > 0 && (
            <p>• Attached files: {files.length} file(s)</p>
          )}
        </div>
      </div>
    </div>
  )
}

export type { RequestActionFormData }
