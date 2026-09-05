import * as contractService from "../src/services/contractService.js";

async function testContractCreation() {
  console.log("Testing contract creation...");
  const initialContracts = await contractService.getContracts();
  console.log("Initial contract count:", initialContracts.length);

  const newContract = await contractService.createContract({
    employeeId: "emp-7",
    employeeName: "Liam Gallagher",
    department: "Engineering",
    jobPosition: "Principal Engineer",
    wage: 150000,
    startDate: "2026-10-01",
    endDate: null,
    salaryStructure: "Regular Salary",
    status: "Active",
  });

  console.log("Created contract:", newContract.contractId, "for", newContract.employeeName);

  const updatedContracts = await contractService.getContracts({ employeeId: "emp-7" });
  console.log("Contracts for emp-7 after creation:");
  updatedContracts.forEach((c) => {
    console.log(`- ${c.contractId}: ${c.jobPosition} | Status: ${c.status} | Wage: ₹${c.wage}`);
  });
}

testContractCreation().catch((err) => {
  console.error("Test error:", err);
});
