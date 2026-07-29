const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.actionItem.deleteMany();
  await prisma.complianceDirective.deleteMany();
  await prisma.regulatoryAuthority.deleteMany();

  const authorities = await prisma.regulatoryAuthority.createManyAndReturn({
    data: [
      {
        name: 'EU Market Surveillance Office',
        jurisdiction: 'EU',
        contactEmail: 'ops@eu-mso.example',
      },
      {
        name: 'US Securities and Exchange Commission',
        jurisdiction: 'US',
        contactEmail: null,
      },
      {
        name: 'APAC Financial Integrity Board', 
        jurisdiction: 'APAC',
        contactEmail: 'alerts@apac-fib.example',
      },
    ],
  });

  const directives = [];
  for (const authority of authorities) {
    directives.push(
      ...(await prisma.complianceDirective.createManyAndReturn({
        data: [
          {
            authorityId: authority.id,
            title: authority.name.includes('EU') ? 'EMIR Reconciliation Update' : 'Cross-Border Disclosure Rule',
            code: authority.name.includes('EU') ? 'EU-EMIR-17' : 'SEC-CLS-41',
            summary: authority.name.includes('EU') ? 'Mandatory reconciliation schedule revised after audit findings.' : 'Disclosure threshold was amended without a published appendix.',
            effectiveDate: new Date('2026-07-01T00:00:00.000Z'),
            status: authority.name.includes('US') ? 'Conflicted' : 'Pending',
            severity: authority.name.includes('EU') ? 'High' : 'Medium',
            rawText: authority.name.includes('US') ? 'Conflicting status code; missing date; malformed text' : 'Revised guidance published with ambiguous annex reference',
          },
          {
            authorityId: authority.id,
            title: authority.name.includes('APAC') ? 'AML Transaction Monitoring Review' : 'KYC File Retention Revision',
            code: authority.name.includes('APAC') ? 'APAC-AML-09' : 'EU-KYC-03',
            summary: authority.name.includes('APAC') ? 'Monitoring thresholds have diverged from previous guidance.' : 'Retention period is inconsistent across internal records.',
            effectiveDate: null,
            status: 'Flagged',
            severity: 'Low',
            rawText: authority.name.includes('APAC') ? 'missing effective date and inconsistent status' : 'Needs manual review: malformed text and invalid date',
          },
        ],
      }))
    );
  }

  for (let index = 0; index < directives.length; index += 1) {
    const directive = directives[index];
    const isFlagged = index % 2 === 0;
    await prisma.actionItem.createMany({
      data: [
        {
          directiveId: directive.id,
          title: isFlagged ? 'Validate publication timestamp' : 'Confirm implementation owner',
          description: isFlagged ? 'The directive text contains a suspicious status code and needs manual review.' : 'Assign an accountable owner for the rollout plan.',
          status: isFlagged ? 'Pending' : 'Resolved',
          owner: isFlagged ? null : 'R. Patel',
          dueDate: isFlagged ? null : new Date('2026-07-30T00:00:00.000Z'),
          priority: isFlagged ? 'High' : 'Medium',
          flagged: isFlagged,
          flagReason: isFlagged ? 'Malformed status field and missing due date' : null,
        },
        {
          directiveId: directive.id,
          title: 'Archive legacy policy references',
          description: 'Cross-reference the latest directive against archived policies and remove stale links.',
          status: 'Pending',
          owner: 'M. Alvarez',
          dueDate: new Date('2026-08-02T00:00:00.000Z'),
          priority: 'Low',
          flagged: false,
          flagReason: null,
        },
      ],
    });
  }

  console.log('Seed data created');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
