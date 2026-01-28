'use client'

import { PriceGroupList } from '@/components/PriceGroupList'
import { RequestAccessForm } from '@/components/RequestAccessForm'
import type { UserGroupAccess, Branch, AccessRequest } from '@/types'

interface HomeClientSectionsProps {
  userAccess: UserGroupAccess[]
  branches: Branch[]
  accessRequest: AccessRequest | null
}

export function HomeClientSections({ userAccess, branches, accessRequest }: HomeClientSectionsProps) {
  return (
    <>
      <PriceGroupList initialData={userAccess} />
      <RequestAccessForm initialBranches={branches} initialRequest={accessRequest} />
    </>
  )
}
