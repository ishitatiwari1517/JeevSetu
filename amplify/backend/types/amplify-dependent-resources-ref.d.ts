export type AmplifyDependentResourcesAttributes = {
  "api": {
    "petvueapi": {
      "ApiName": "string",
      "RootUrl": "string"
    }
  },
  "auth": {
    "petvueauth": {
      "AppClientID": "string",
      "AppClientIDWeb": "string",
      "HostedUIDomain": "string",
      "IdentityPoolId": "string",
      "IdentityPoolName": "string",
      "OAuthMetadata": "string",
      "UserPoolArn": "string",
      "UserPoolId": "string",
      "UserPoolName": "string"
    }
  },
  "custom": {
    "scanPipelineResources": {
      "ActivityLogsTableArn": "string",
      "ActivityLogsTableName": "string",
      "BookingsTableArn": "string",
      "BookingsTableName": "string",
      "IntakeFormsTableArn": "string",
      "IntakeFormsTableName": "string",
      "ScanBucketArn": "string",
      "ScanBucketName": "string",
      "ScanQueueArn": "string",
      "ScanQueueUrl": "string",
      "ScansTableArn": "string",
      "ScansTableName": "string",
      "VaccinationsTableArn": "string",
      "VaccinationsTableName": "string",
      "VetCacheTableArn": "string",
      "VetCacheTableName": "string",
      "WeightLogsTableArn": "string",
      "WeightLogsTableName": "string"
    }
  },
  "function": {
    "aiScan": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "bookingRecord": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "intakeSubmit": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "petMetrics": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "scanEnqueue": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "scanInitiate": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "scanResult": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "scanWorker": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "vaccinationRecord": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "vetFinder": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    }
  }
}