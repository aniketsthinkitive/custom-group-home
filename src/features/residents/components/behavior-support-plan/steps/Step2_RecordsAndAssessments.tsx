import React, { useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import DatePickerField from '../../../../../components/date-picker-field/date-picker-field';
import CustomFileUpload, { type FileItem } from '../../../../../components/custom-fileupload/custom-fileupload';

interface Step2Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const Step2_RecordsAndAssessments: React.FC<Step2Props> = ({ control, mode = "new" }) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);

  const handleFilesChange = (files: FileItem[]) => {
    if (mode !== "view") {
      setUploadedFiles(files);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37', mb: 2 }}>
          Records Reviewed
        </Typography>
      </Grid>

      {/* Records Reviewed Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            {/* Individual Service Agreement */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="individualServiceAgreementAgency"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Individual Service Agreement - Agency" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="individualServiceAgreementAgency"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="individualServiceAgreementDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Date" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="individualServiceAgreementDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>

            {/* Previous BSP */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="previousBSPAuthor"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Previous BSP - Author" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="previousBSPAuthor"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="previousBSPDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Date" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="previousBSPDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>

            {/* Risk Management Plan */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="riskManagementPlanAuthor"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Risk Management Plan - Author" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="riskManagementPlanAuthor"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="riskManagementPlanDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Date" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="riskManagementPlanDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>

            {/* Other Relevant Files */}
            <Grid size={{ xs: 12 }}>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Other Relevant Files" />
                </Grid>
                <Grid>
                  <CustomFileUpload
                    files={uploadedFiles}
                    onFilesChange={handleFilesChange}
                    type="default"
                    size="md"
                    multiple={true}
                    accept="image/*"
                    placeholder="Click to upload or drag and drop SVG, PNG, JPG or GIF (max. 800x400px)"
                    helperText="SVG, PNG, JPG or GIF (max. 800x400px)"
                    showFileList={true}
                    allowDragDrop={true}
                    disabled={mode === "view"}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37', mb: 2 }}>
          Assessments Reviewed
        </Typography>
      </Grid>

      {/* Assessments Reviewed Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="preferenceAssessmentDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Preference Assessment" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="preferenceAssessmentDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="functionalBehaviorAssessmentDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Functional Behavior Assessment" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="functionalBehaviorAssessmentDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="aflsDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="AFLS (Assessment of Functional Living Skills)" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="aflsDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="ssisSelDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="SSIS-SEL (Social-Emotional Learning)" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="ssisSelDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="otherAssessments"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Other Assessments" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="otherAssessments"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Step2_RecordsAndAssessments;

