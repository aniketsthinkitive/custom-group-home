import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { type FieldValues, Control } from 'react-hook-form';

interface Step4Props {
  control: Control<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step4TerminationConditions: React.FC<Step4Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography
          sx={{ fontSize: "16px", fontWeight: 700, color: "#1F2A37", mb: 2 }}
        >
          Conditions for Ending the Residency Agreement
        </Typography>
      </Grid>

      {/* Section Content */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 3,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: "100%",
              backgroundColor: "#F5F7FA",
              border: "1px solid #E3ECEF",
              borderRadius: "8px",
              p: 3,
            }}
          >
            {/* Provider Termination Section */}
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1F2A37",
                mb: 2,
              }}
            >
              If the Provider Chooses to End the Residency Agreement:
            </Typography>

            <Box
              component="ul"
              sx={{
                margin: 0,
                paddingLeft: "20px",
                mb: 4,
              }}
            >
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>I.</strong> The provider shall notify the resident,
                legal guardian (if applicable), and service coordinator in
                writing of the intended termination of the residency agreement
                and the reason(s) therefor, at least 90 calendar days before the
                proposed termination date of the residency agreement, and in an
                agency residence, inform the resident that this notice is not an
                order requiring them to vacate the residence, and include the
                rights of the resident to appeal the provider's decision to
                terminate the residency agreement in accordance with He-M
                310.12.
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>II.</strong> The resident, or legal guardian if
                applicable, shall have the right to request a team meeting to
                discuss whether the provider would reconsider the notice.
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>III.</strong> Upon receipt of the notice required in I.
                above, the service coordinator shall convene a team meeting
                within ten calendar days to develop a transition plan for the
                resident in order to ensure an appropriate transition to an
                alternative residence.
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>IV.</strong> In cases where the behavior of the resident
                poses a serious threat of bodily harm to the provider or others
                living in the residence, or substantial damage to the residence
                or property, the provider shall notify the resident, legal
                guardian (if applicable), and the service coordinator of the
                situation and provide 72 hours' notice before the proposed
                termination date, and in an agency residence, inform the
                resident that this notice is not an order requiring them to
                vacate the residence, and include the rights of the resident to
                appeal the provider's decision to terminate the residency
                agreement in accordance with He-M 310.12.
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>V.</strong> Upon receipt of notification in IV. above,
                the service coordinator, or designee, shall immediately convene
                a team meeting within 24 hours to determine and take the
                appropriate course of action to ensure the resident's health and
                safety, and ensure that the resident has access to an
                alternative safe residence.
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>VI.</strong> If the provider is an agency residence, if
                the resident fails to vacate the residence by the proposed
                termination date, the provider shall issue a notice to the
                resident or legal guardian, if applicable, for the resident to
                vacate the residence within 3 days, and include the rights of
                the resident to appeal the notice in accordance with He-M 310.12
                and remain in the residence in accordance with He-M 310.12(d).
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>VII.</strong> In the absence of the conditions for
                termination provided in IV. above, an agency residence shall
                only terminate this agreement if the termination is necessary
                for the resident's welfare and the resident's needs can no
                longer be met at the agency residence, the residence ceases to
                operate, or for other good cause as provided in He-M
                310.10(c)(7)c.
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: "100%",
              backgroundColor: "#F5F7FA",
              border: "1px solid #E3ECEF",
              p: 3,
              borderRadius: "8px",
            }}
          >
            {/* Resident Termination Section */}
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1F2A37",
                mb: 2,
                mt: 4,
              }}
            >
              If the Resident Chooses to End the Residency Agreement:
            </Typography>

            <Box
              component="ul"
              sx={{
                margin: 0,
                paddingLeft: "20px",
              }}
            >
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>I.</strong> The resident, or legal guardian if
                applicable, will notify the provider and service coordinator in
                writing of the intended termination of the residency agreement
                90 calendar days prior to the proposed termination date.
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>II.</strong> In cases where the behavior of the provider
                poses a serious threat of bodily harm to the resident or others
                living in the residence, or substantial damage to the residence
                or property:
                <Box
                  component="ul"
                  sx={{
                    margin: 0,
                    paddingLeft: "20px",
                    mt: 1,
                  }}
                >
                  <Box
                    component="li"
                    sx={{
                      fontSize: "14px",
                      color: "#424342",
                      lineHeight: "1.8",
                      mb: 1,
                    }}
                  >
                    <strong>a.</strong> The resident, or guardian if applicable,
                    shall notify the service coordinator of the situation.
                  </Box>
                  <Box
                    component="li"
                    sx={{
                      fontSize: "14px",
                      color: "#424342",
                      lineHeight: "1.8",
                      mb: 1,
                    }}
                  >
                    <strong>b.</strong> The provider shall receive 72 hours'
                    notice before the proposed termination date.
                  </Box>
                </Box>
              </Box>
              <Box
                component="li"
                sx={{
                  fontSize: "14px",
                  color: "#424342",
                  lineHeight: "1.8",
                  mb: 2,
                }}
              >
                <strong>III.</strong> Upon receipt of notification in II. above,
                the Service Coordinator, or designee, shall:
                <Box
                  component="ul"
                  sx={{
                    margin: 0,
                    paddingLeft: "20px",
                    mt: 1,
                  }}
                >
                  <Box
                    component="li"
                    sx={{
                      fontSize: "14px",
                      color: "#424342",
                      lineHeight: "1.8",
                      mb: 1,
                    }}
                  >
                    <strong>a.</strong> Immediately convene a team meeting, in
                    accordance with the requirements of He-M 503, within 24
                    hours to determine the appropriate course of action to
                    ensure the resident's health and safety, and that the
                    resident has access to an alternative safe residence, and
                  </Box>
                  <Box
                    component="li"
                    sx={{
                      fontSize: "14px",
                      color: "#424342",
                      lineHeight: "1.8",
                      mb: 1,
                    }}
                  >
                    <strong>b.</strong> Ensure that the complaint procedure in
                    He-M 202 is initiated.
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step4TerminationConditions;

