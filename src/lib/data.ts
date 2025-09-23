export const user = {
  name: 'Sarah Walker',
  email: 'sarah.walker@conflux.com',
  avatar: 'https://picsum.photos/seed/user1/100/100',
};

export const projects = [
  {
    id: 'PROJ-001',
    name: 'Downtown Tower Renovation',
    status: 'In Progress',
    owner: 'Nexus Properties',
    startDate: '2023-01-15',
    endDate: '2024-12-31',
    budget: 5000000,
    completion: 65,
  },
  {
    id: 'PROJ-002',
    name: 'Greenfield Industrial Park',
    status: 'On Track',
    owner: 'Innovate Corp',
    startDate: '2023-03-01',
    endDate: '2025-06-30',
    budget: 12000000,
    completion: 40,
  },
  {
    id: 'PROJ-003',
    name: 'Coastal Bridge Retrofit',
    status: 'Delayed',
    owner: 'State Transport Authority',
    startDate: '2022-09-01',
    endDate: '2024-09-01',
    budget: 8500000,
    completion: 85,
  },
  {
    id: 'PROJ-004',
    name: 'Suburban Housing Development',
    status: 'Completed',
    owner: 'Homestead Builders',
    startDate: '2021-06-10',
    endDate: '2023-11-20',
    budget: 25000000,
    completion: 100,
  },
  {
    id: 'PROJ-005',
    name: 'City General Hospital Wing',
    status: 'Planning',
    owner: 'Metropolis Health',
    startDate: '2024-05-01',
    endDate: '2026-12-15',
    budget: 15000000,
    completion: 5,
  },
];

export const tasks = [
  { id: 'TASK-8717', title: 'Review structural blueprints', status: 'Done', priority: 'High', assignee: { name: 'Sarah Walker', avatar: 'https://picsum.photos/seed/user1/100/100' } },
  { id: 'TASK-8718', title: 'Finalize electrical wiring plan', status: 'In Progress', priority: 'Medium', assignee: { name: 'Mike Ross', avatar: 'https://picsum.photos/seed/user2/100/100' } },
  { id: 'TASK-8719', title: 'Procure HVAC units', status: 'Backlog', priority: 'Medium', assignee: { name: 'John Smith', avatar: 'https://picsum.photos/seed/user4/100/100' } },
  { id: 'TASK-8720', title: 'Submit plumbing permit application', status: 'In Progress', priority: 'High', assignee: { name: 'Jane Doe', avatar: 'https://picsum.photos/seed/user3/100/100' } },
  { id: 'TASK-8721', title: 'Hire scaffolding subcontractor', status: 'Done', priority: 'Low', assignee: { name: 'Sarah Walker', avatar: 'https://picsum.photos/seed/user1/100/100' } },
  { id: 'TASK-8722', title: 'Install foundation rebar', status: 'In Progress', priority: 'High', assignee: { name: 'Mike Ross', avatar: 'https://picsum.photos/seed/user2/100/100' } },
  { id: 'TASK-8723', title: 'On-site safety inspection', status: 'Backlog', priority: 'Medium', assignee: { name: 'Emily White', avatar: 'https://picsum.photos/seed/user5/100/100' } },
];

export const issues = [
  { id: 'ISS-001', title: 'Material delivery delay for steel beams', status: 'Open', priority: 'High', assignee: 'Mike Ross' },
  { id: 'ISS-002', title: 'Incorrect concrete mix delivered', status: 'In Progress', priority: 'High', assignee: 'John Smith' },
  { id: 'ISS-003', title: 'Minor leak in temporary water line', status: 'Resolved', priority: 'Low', assignee: 'Jane Doe' },
  { id: 'ISS-004', title: 'Crane operator unavailable for Tuesday', status: 'Open', priority: 'Medium', assignee: 'Mike Ross' },
  { id: 'ISS-005', title: 'Blueprint discrepancy on 3rd floor layout', status: 'In Progress', priority: 'High', assignee: 'Sarah Walker' },
];

export const documents = [
  { id: 'DOC-001', name: 'Structural-Blueprints-Rev4.pdf', version: 4, lastModified: '2024-05-18', modifiedBy: 'Sarah Walker', uploadCount: 5, modificationCount: 12 },
  { id: 'DOC-002', name: 'Electrical-Plan-Main-Tower.dwg', version: 2, lastModified: '2024-05-15', modifiedBy: 'Mike Ross', uploadCount: 2, modificationCount: 3 },
  { id: 'DOC-003', name: 'Plumbing-Permit-Application.pdf', version: 1, lastModified: '2024-05-12', modifiedBy: 'Jane Doe', uploadCount: 1, modificationCount: 1 },
  { id: 'DOC-004', name: 'Weekly-Safety-Report-W20.docx', version: 1, lastModified: '2024-05-20', modifiedBy: 'John Smith', uploadCount: 1, modificationCount: 1 },
  { id: 'DOC-005', name: 'Change-Order-CO-007.pdf', version: 1, lastModified: '2024-05-19', modifiedBy: 'Sarah Walker', uploadCount: 1, modificationCount: 1 },
];

export const users = [
  { id: 'USR-001', name: 'Sarah Walker', email: 'sarah.walker@conflux.com', role: 'Admin' },
  { id: 'USR-002', name: 'Mike Ross', email: 'mike.ross@conflux.com', role: 'Project Manager' },
  { id: 'USR-003', name: 'Jane Doe', email: 'jane.doe@subcontractors.com', role: 'Subcontractor' },
  { id: 'USR-004', name: 'John Smith', email: 'john.smith@contractors.com', role: 'Contractor' },
  { id: 'USR-005', name: 'Emily White', email: 'emily.white@conflux.com', role: 'Project Manager' },
];
