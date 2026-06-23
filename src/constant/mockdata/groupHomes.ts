import { GroupHome } from "../../features/settings/components/GroupHomesTable";

// Generate 100 mock group homes for pagination demo
const generateMockGroupHomes = (): GroupHome[] => {
  const baseHomes: GroupHome[] = [
    {
      id: "1",
      name: "New Memory care",
      email: "bill.sanders@example.com",
      contactNumber: "(308) 555-0121",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "2",
      name: "Buena Vista Assisted Living",
      email: "willie.jennings@example.com",
      contactNumber: "(907) 555-0101",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "3",
      name: "Murray Highland Memory Care",
      email: "nevaeh.simmons@example.com",
      contactNumber: "(808) 555-0111",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "4",
      name: "Crossroads",
      email: "jessica.hanson@example.com",
      contactNumber: "(239) 555-0108",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "5",
      name: "Conyers Residential Home",
      email: "tim.jennings@example.com",
      contactNumber: "(319) 555-0115",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "6",
      name: "Mercy Senior Housing",
      email: "georgia.young@example.com",
      contactNumber: "(303) 555-0105",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "7",
      name: "Shalev Senior Living",
      email: "tanya.hill@example.com",
      contactNumber: "(217) 555-0113",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "8",
      name: "Mill View Memory Care",
      email: "debbie.baker@example.com",
      contactNumber: "(201) 555-0124",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "9",
      name: "Markham House Assisted Living",
      email: "kenzi.lawson@example.com",
      contactNumber: "(225) 555-0118",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
    {
      id: "10",
      name: "Mercy Senior Housing North",
      email: "scott.mitchell@example.com",
      contactNumber: "(415) 555-0199",
      address: `${Math.floor(Math.random() * 1000)} Baker Street, Near Regent's Park, Springfield, California, 90210`,
    },
  ];

  // Duplicate to reach 100 rows
  const allHomes: GroupHome[] = [];
  for (let i = 0; i < 100; i++) {
    const baseHome = baseHomes[i % baseHomes.length];
    allHomes.push({
      ...baseHome,
      id: String(i + 1),
      name: `${baseHome.name} ${i >= baseHomes.length ? `(${Math.floor(i / baseHomes.length) + 1})` : ""}`.trim(),
    });
  }
  return allHomes;
};

export const mockGroupHomes: GroupHome[] = generateMockGroupHomes();
