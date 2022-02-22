import React from 'react'
import ActiveStatus from '../ActiveStatus'

const headers = [
  {
    cellFormatter: (cellData, rowData) => {
      if (!cellData) {
        return '-'
      }

      return `${cellData} ${rowData.lastname}`
    },
    name: '이름',
    value: 'firstname',
  },
  {
    name: '이메일',
    value: 'email',
  },
  {
    cellFormatter: (cellData) => {
      // Only display the role's name
      return cellData.map((role) => role.name).join(',\n')
    },
    name: '역할',
    value: 'roles',
  },
  {
    name: '닉네임',
    value: 'username',
  },
  {
    // eslint-disable-next-line react/prop-types
    cellAdapter: ({ isActive }) => {
      return (
        <ActiveStatus isActive={isActive}>
          {isActive ? 'Active' : 'Inactive'}
        </ActiveStatus>
      )
    },
    name: '활성화',
    value: 'isActive',
  },
]

export default headers
