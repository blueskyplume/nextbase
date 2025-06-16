"use client";
import OperateModal from '@/components/operate-modal';
import { useState, useImperativeHandle, useContext } from 'react';
import { useTranslation } from '@/utils/i18n';
import { Upload, Button, message } from 'antd';
import type { UploadProps } from 'antd'
import { InboxOutlined } from '@ant-design/icons';
import { supabase } from '@/utils/supabaseClient';
import { ModalConfig } from '@/types';
import { UserInfoContext } from '@/context/userInfo';
import { User } from '@supabase/supabase-js';
const { Dragger } = Upload;

const UploadModal = ({ ref, onSuccess }: { ref: any; onSuccess: () => void }) => {
  const { t } = useTranslation();
  const { user } = useContext(UserInfoContext);
  const [visiable, setVisiable] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any>([]);
  const [formData, setFormData] = useState<any>();

  useImperativeHandle(ref, () => ({
    showModal: ({ type, form }: ModalConfig) => {
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
        message.warning('仅支持上传csv文件')
      }
      return isCSV;
    },
    accept: '.csv'
  };

  const handleSubmit = async () => {
    setConfirmLoading(true);
    const file = fileList[0];
    const { id, app_metadata } = user as User;
    console.log(id, app_metadata)
    if(!file) {
      setConfirmLoading(false);
      return message.error('请上传文件');
    }
    const { data, error } = await supabase.storage
      .from('datasets')
      .upload(`${formData.dataset_id}/${file.name}`, file.originFileObj, {
        cacheControl: '3600',
        upsert: false
      });
    if (!error) {
      await supabase.from('anomaly_detection_train_data').insert([
        {
          dataset_id: formData.dataset_id,
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
      message.error('下载失败');
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
      <p>仅支持csv格式的文件，点击<Button type='link' onClick={downloadTemplate}>下载模板</Button></p>
    </OperateModal>
  )
};

export default UploadModal;