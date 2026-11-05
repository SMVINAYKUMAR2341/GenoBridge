import type { Access, FieldAccess } from 'payload'
import { commandFor, isAppAdmin, isClinicalStaff, isProvider, isReviewer } from '../lib/workflow-security'

export const cmsAdmin: Access = ({ req }) => req.user?.collection === 'admins'
export const clinicalStaff: Access = ({ req }) => isClinicalStaff(req.user)
export const specialist: Access = ({ req }) => isReviewer(req.user)
export const approvalField: FieldAccess = ({ req }) =>
  isReviewer(req.user) && commandFor(req)?.kind === 'governance'
export const serverOwned: FieldAccess = ({ req }) => !!commandFor(req)
export const workflowCreate: Access = ({ req }) => {
  const kind = commandFor(req)?.kind
  return isClinicalStaff(req.user) &&
    (kind === 'draft' || kind === 'submit' || (isProvider(req.user) && (kind === 'review' || kind === 'finalize' || kind === 'return')))
}
export const workflowRead: Access = ({ req }) => isClinicalStaff(req.user) ||
  (isAppAdmin(req.user) && commandFor(req)?.kind === 'metrics')
