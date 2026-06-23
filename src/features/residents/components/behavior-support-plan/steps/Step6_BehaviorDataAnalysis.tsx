import React, { useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';
import CustomFileUpload, { type FileItem } from '../../../../../components/custom-fileupload/custom-fileupload';

interface Step6Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const Step6_BehaviorDataAnalysis: React.FC<Step6Props> = ({ control, mode = "new" }) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);

  const handleFilesChange = (files: FileItem[]) => {
    if (mode !== "view") {
      setUploadedFiles(files);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Behavior Data Analysis Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container direction="column" spacing={2}>
            {/* Main Title */}
            <Grid>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
                Behavior Data Analysis
              </Typography>
            </Grid>

            {/* File Upload Area */}
            <Grid>
              <CustomFileUpload
                files={uploadedFiles}
                onFilesChange={handleFilesChange}
                type="default"
                size="md"
                multiple={false}
                accept="image/*"
                placeholder="Click to upload or drag and drop SVG, PNG, JPG or GIF (max. 800x400px)"
                helperText="SVG, PNG, JPG or GIF (max. 800x400px)"
                showFileList={true}
                allowDragDrop={true}
                disabled={mode === "view"}
              />
            </Grid>

            {/* Or Divider */}
            <Grid>
              <Grid container sx={{ justifyContent: 'center', alignItems: 'center', py: 1 }}>
                <CustomLabel
                  label="Or"
                  style={{ fontSize: '14px', color: '#757775' }}
                />
              </Grid>
            </Grid>

            {/* Link Input */}
            <Grid>
              <Grid container spacing={1} sx={{ alignItems: 'center' }}>
                <Grid>
                  <LinkIcon sx={{ color: '#757775', fontSize: '20px' }} />
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Controller
                    name="graphLink"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Paste link to external graph or data visualization..."
                        name="graphLink"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Graph Analysis Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container direction="column" spacing={1}>
            <Grid>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
                Graph Analysis
              </Typography>
            </Grid>
            <Grid>
              <CustomLabel
                label="Description of Graph Results"
                style={{ fontSize: '14px', color: '#757775' }}
              />
            </Grid>
            <Grid>
              <Controller
                name="graphAnalysis"
                control={control}
                render={({ field }) => (
                  <CustomTextArea
                    name="graphAnalysis"
                    placeholder="Enter"
                    value={field.value}
                    onChange={field.onChange}
                    minRow={8}
                    isDisabled={mode === "view"}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Step6_BehaviorDataAnalysis;

