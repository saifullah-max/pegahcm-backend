import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '31af5a53-f18b-4916-a71a-da4acdefd0e4';

  const permissions = [
    '01980f58-cdca-4308-a698-2f94e3cce3d7',
    '02a1c50b-e400-4902-819d-08a9695956d2',
    '07f55665-267c-4448-b00f-7bf6c13e883f',
    '088f4503-4a86-46ab-849a-7329f90c9be5',
    '08bc43e3-dc4c-432c-8511-5a34a8980e35',
    '0ef2671d-fa35-42e7-982d-f1b2a1fb260c',
    '0f4ad3ad-5493-44f3-906b-f9799fcf2e0f',
    '225fc016-9f6a-4dd3-a96d-5f4fe687e630',
    '23246974-13b7-4126-96b0-0ba45abef7bc',
    '24fb165f-697f-44ab-b8a6-f5c345ef6246',
    '25e0d667-dc5e-4b93-847f-c568312730d0',
    '28c354a5-8c4e-4605-b60e-dfcf7ae65597',
    '29c17201-d2fb-4f53-aca7-6d672d66919a',
    '2f07b91b-6745-4911-a0be-cecf57a167c4',
    '2f83ddd7-00f8-4046-af39-115ff5d35a43',
    '353bee83-0c4d-4112-bba7-e8a532d7daa8',
    '36317037-a0ae-47d3-b150-da43f3379370',
    '3ba6aa4d-01c9-49a3-9d02-3879fd2f6628',
    '3d68ac23-4693-4d24-83b9-f0a435c34c3e',
    '3ec44d59-3908-47f9-9d82-1dd37780674d',
    '47a22538-15af-438b-8053-41f59904851f',
    '48811c38-2229-4a48-a4e5-1b5f6b76a115',
    '4c40feb8-44c9-438e-b404-2636c3ae7a5b',
    '514e2518-0929-4655-800c-b4a3d8905e60',
    '51950d3e-996a-454b-a7be-ee7e3fee0269',
    '52fbdbf4-3511-400f-bc3b-b0b2c96e21f4',
    '54c44d99-e2f3-47ae-91bc-9abb5fd61943',
    '58e9d44f-62ce-4467-8279-5e37e787a618',
    '5b2ebd61-0623-4ead-93d8-d679ec449634',
    '5f4f4204-d800-4c90-9735-400122dd9a9f',
    '695d71d7-4ded-49c4-bbc6-c482e3044efa',
    '6ca59356-10c9-4530-9944-047997413126',
    '6cf8191f-d025-4af1-b548-91fcba368fd9',
    '6ffd545f-fb3c-43e3-9b55-44b93160f2c1',
    '725d08d4-3046-4ce3-b859-7bb02e5602b3',
    '72a3811c-a823-4947-bf9e-7e23c1a04359',
    '75bedbad-6b94-4880-86c6-2f292bfe64a1',
    '76994099-8677-4618-9daf-63bb3c73c683',
    '7859f833-a8be-4139-bcd8-ae0c3ea89931',
    '7b005c73-f26c-4fde-a5b9-e2c3ab2bd9ec',
    '7d587151-0188-4921-b7f0-6372285d94e9',
    '834fff04-79a0-4a9c-a405-ac51ff9c9036',
    '84cf28ed-5a05-4b1d-b674-fa6c1cd3f33a',
    '857ae9c3-cadd-4015-98cc-bf70e96c6114',
    '8a7675d3-32ee-4841-b123-4240693b34c6',
    '8c721f7a-9aec-4e2b-9eb7-e6a3dbbe0da1',
    '8ce82f0a-4c8d-434c-830b-8b8dfe638ab8',
    '8df7f826-01d0-45df-b304-8b242aae335d',
    '8f3b414b-3d19-4bb9-93dd-773545a5e6ba',
    '93355116-78e3-4450-b723-277c781b524f',
    '96f9a2a5-f338-4684-a620-c8d6c47d6452',
    '9781c024-9387-4cbb-9004-e750a05e8132',
    'a72c9478-b86c-4610-8df2-e7b7738a3a55',
    'aa236ab6-76e3-4e24-9478-f62aae204e07',
    'ac0f7efa-5692-4b4d-b4d8-8396a66d48fd',
    'b06de67b-b143-4d57-92e8-8e498468c0c3',
    'b9a4461c-f83d-4f5a-9e97-7e2b9f0d6f40',
    'bc1c61e2-24ba-4b0d-bb0a-7902efaf1d45',
    'bc82791d-a7b4-4cc1-96ad-bb0ba4ef4324',
    'bdce77c2-0c1e-4aea-9b10-50c8c3da13c8',
    'bf073caf-6f6a-4448-98df-553ba4fb6dd1',
    'cd3cceaf-64e9-4ef3-9510-376f6ff14f67',
    'd2f792a0-057c-4830-9253-53c5f2b0b987',
    'd48c8954-265b-48ab-902e-14b9e41168ca',
    'd57ef965-f2a5-47cd-96fd-b75fc0e287b3',
    'd9611414-e40b-406e-9289-07536914cec1',
    'dbd70a9e-e3f6-4938-8aa5-29de1a0d6290',
    'dcd7e8e8-4b7f-47a4-9fe3-eeaab6333d69',
    'ddb7d230-29b7-44ed-97f2-3de8a2727713',
    'e882c2fd-ff65-4c7d-bcb6-92ba46f2fdf1',
    'ea212072-127b-4d6e-b883-b604cc7afcfd',
    'eb35f073-978e-40f1-8b7b-b79375b5082b',
    'f0f2c8d1-38c5-46eb-8558-90e2ac3ddbd5',
    'fa6db83d-0bf1-48c3-b973-897446213dc1',
    'fc07ea79-c8e2-49b3-887f-f137d749638a'
  ];

  for (const permissionId of permissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
      update: {}, // Do nothing if it already exists
      create: {
        userId,
        permissionId,
      },
    });
  }

  console.log('Permissions assigned successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
