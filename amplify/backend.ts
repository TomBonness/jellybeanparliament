import { defineBackend } from "@aws-amplify/backend";
import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

const backend = defineBackend({});
const dataStack = backend.createStack("jellybeanParliamentData");

const puzzlesTable = new Table(dataStack, "JellybeanPuzzles", {
  partitionKey: { name: "puzzleId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

const guessesTable = new Table(dataStack, "JellybeanGuesses", {
  partitionKey: { name: "puzzleId", type: AttributeType.STRING },
  sortKey: { name: "guessId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.RETAIN,
});

const computeRole = new Role(dataStack, "JellybeanParliamentAmplifyComputeRole", {
  assumedBy: new ServicePrincipal("amplify.amazonaws.com"),
  description: "Least-privilege Amplify Hosting SSR compute role for Jellybean Parliament API routes.",
});

puzzlesTable.grantReadWriteData(computeRole);
guessesTable.grantReadWriteData(computeRole);

backend.addOutput({
  custom: {
    jellybeanPuzzlesTableName: puzzlesTable.tableName,
    jellybeanGuessesTableName: guessesTable.tableName,
    jellybeanComputeRoleArn: computeRole.roleArn,
  },
});
