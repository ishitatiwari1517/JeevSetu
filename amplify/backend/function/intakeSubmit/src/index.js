const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    try {
        // Validate Authorization
        if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims) {
            return {
                statusCode: 401,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({ error: "Unauthorized" })
            };
        }

        const userId = event.requestContext.authorizer.claims.sub;
        const body = JSON.parse(event.body);

        // Validate basic payload
        if (!body.petName) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({ error: "Missing pet name" })
            };
        }

        const intakeId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const params = {
            TableName: process.env.INTAKE_FORMS_TABLE || "petvue-intake-forms-dev", // Note: The actual table name depends on env, but we'll try to get it from ENV later if mapped
            Item: {
                intakeId: intakeId,
                userId: userId,
                createdAt: createdAt,
                ...body,
                status: 'SUBMITTED'
            }
        };

        // Try to get dynamic table name if passed from CloudFormation
        if (process.env.INTAKE_FORMS_TABLE_NAME) {
            params.TableName = process.env.INTAKE_FORMS_TABLE_NAME;
        }

        await docClient.send(new PutCommand(params));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                message: "Intake form submitted successfully",
                intakeId: intakeId
            })
        };
    } catch (error) {
        console.error("Error processing intake form:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ error: "Internal server error" })
        };
    }
};
