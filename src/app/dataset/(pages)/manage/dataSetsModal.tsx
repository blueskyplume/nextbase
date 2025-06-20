"use client";
import OperateModal from '@/components/operate-modal';
import { Form, Input, Button, FormInstance, message } from 'antd';
import { useState, useImperativeHandle, useEffect, useRef } from 'react';
import { useTranslation } from '@/utils/i18n';
import { SupabaseClient, User } from '@supabase/supabase-js';

interface DatasetModalProps {
  supabase: SupabaseClient;
  user: User;
  options?: any,
  onSuccess: () => void;
  [key: string]: any
}

const DatasetModal = ({ ref, supabase, user, onSuccess }: DatasetModalProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('edit');
  const [title, setTitle] = useState<string>('editform');
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
  });
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const formRef = useRef<FormInstance>(null);

  useImperativeHandle(ref, () => ({
    showModal: ({ type, title, form }: {
      type: string;
      title: string;
      form: any;
    }) => {
      setIsModalOpen(true);
      setType(type);
      setTitle(title);
      setFormData(form);
    }
  }));

  useEffect(() => {
    if (isModalOpen && formRef.current) {
      formRef.current?.resetFields();
      formRef.current?.setFieldsValue({
        ...formData,
      })
    }
  }, [formData, isModalOpen])

  const handleSubmit = async () => {
    setConfirmLoading(true);
    try {
      const _formData = await formRef.current?.validateFields();
      let result;
      if (type === 'add') {
        const { name, description } = _formData;
        const param = {
          name,
          description,
          tenant_id: 1,
          user_id: user.id
        }
        result = await supabase
          .from('anomaly_detection_datasets')
          .insert([param])
          .select();
      } else if (type === 'edit') {
        result = await supabase
          .from('anomaly_detection_datasets')
          .update({
            name: _formData.name,
            description: _formData.description
          })
          .eq('id', formData.id);
      }
      if (result?.error) {
        message.error(result.error.message);
      }
      message.success(t(`datasets.${type}Success`));
      setIsModalOpen(false);
      onSuccess();
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <OperateModal
        title={t(`datasets.${title}`)}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="submit" loading={confirmLoading} type="primary" onClick={handleSubmit}>
            {t('common.confirm')}
          </Button>,
          <Button key="cancel" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>,
        ]}
      >
        <Form ref={formRef} layout="vertical">
          <Form.Item
            name='name'
            label={t('common.name')}
            rules={[{ required: true, message: t('common.inputMsg') }]}
          >
            <Input placeholder={t('common.inputMsg')} />
          </Form.Item>
          <Form.Item
            name='description'
            label={t(`datasets.description`)}
            rules={[{ required: true, message: t('common.inputMsg') }]}
          >
            <Input.TextArea placeholder={t('common.inputMsg')} />
          </Form.Item>
        </Form>
      </OperateModal>
    </>
  )
};

export default DatasetModal;