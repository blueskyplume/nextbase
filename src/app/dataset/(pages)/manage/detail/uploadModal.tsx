"use client";
import OperateModal from '@/components/operate-modal';
import { useState, useImperativeHandle, useContext } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { UserInfoContext } from '@/context/userInfo';
import { useTranslation } from '@/utils/i18n';
import { Upload, Button, message, type UploadFile, type UploadProps } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ModalConfig, TableData } from '@/types';
import { User } from '@supabase/supabase-js';
const { Dragger } = Upload;

const UploadModal = ({ ref, onSuccess }: { ref: any; onSuccess: () => void }) => {
  const { t } = useTranslation();
  const { user } = useContext(UserInfoContext);
  const [visiable, setVisiable] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile<any>[]>([]);
  const [formData, setFormData] = useState<TableData>();

  useImperativeHandle(ref, () => ({
    showModal: ({ form }: ModalConfig) => {
      setVisiable(true);
      setFormData(form);
      console.log(form);
    }
  }));

  const handleChange: UploadProps['onChange'] = ({ fileList }) => {
    setFileList(fileList);
  };

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    fileList: fileList,
    onChange: handleChange,
    beforeUpload: (file) => {
      const isCSV = file.type === "text/csv" || file.name.endsWith('.csv');
      if (!isCSV) {
        message.warning(t('datasets.uploadWarn'))
      }
      return isCSV;
    },
    accept: '.csv'
  };

  const handleSubmit = async () => {
    setConfirmLoading(true);
    const file: UploadFile<any> = fileList[0];
    const { id, app_metadata } = user as User;
    if(!file?.originFileObj) {
      setConfirmLoading(false);
      return message.error(t('datasets.pleaseUpload'));
    }
    const { data, error } = await supabase.storage
      .from('datasets')
      .upload(`${formData?.dataset_id}/${file.name}`, file.originFileObj, {
        cacheControl: '3600',
        upsert: false
      });
    if (!error) {
      await supabase.from('anomaly_detection_train_data').insert([
        {
          dataset_id: formData?.dataset_id,
          tenant_id: app_metadata.tenant_id,
          user_id: id,
          name: file.name,
          storage_path: data.path
        }
      ]);
      setConfirmLoading(false);
      setVisiable(false);
      message.success(t('datasets.uploadSuccess'));
      onSuccess();
    } else {
      setConfirmLoading(false);
      message.error(`${error.message}`);
    }
  };

  const handleCancel = () => {
    setVisiable(false);
  };

  const downloadTemplate = async () => {
    const { data, error } = await supabase.storage.from('datasets').download('template.csv');
    if(data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      message.error(t('datasets.downloadError'));
    }
  }

  return (
    <OperateModal
      title={t(`datasets.upload`)}
      open={visiable}
      onCancel={() => setVisiable(false)}
      footer={[
        <Button key="submit" loading={confirmLoading} type="primary" onClick={handleSubmit}>
          {t('common.confirm')}
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          {t('common.cancel')}
        </Button>,
      ]}
    >
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{t('datasets.uploadText')}</p>
      </Dragger>
      <p>{t('datasets.downloadText')}<Button type='link' onClick={downloadTemplate}>{t('datasets.template')}</Button></p>
    </OperateModal>
  )
};

export default UploadModal;