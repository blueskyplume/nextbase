"use client";
import OperateModal from '@/components/operate-modal';
import { Form, Input, Button, Select, FormInstance, message } from 'antd';
import { useState, useImperativeHandle, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from '@/utils/i18n';
import '@ant-design/v5-patch-for-react-19';
import { DataSet, Option, TrainJob, TrainTaskModalProps } from '@/types';

const TrainTaskModal = ({ ref, supabase, user, onSuccess, datasets }: TrainTaskModalProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('add');
  const [title, setTitle] = useState<string>('addtask');
  const [datasetItems, setDatasetItems] = useState<Option[]>([]);
  const [formData, setFormData] = useState<TrainJob | null>(null);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const formRef = useRef<FormInstance>(null);

  useImperativeHandle(ref, () => ({
    showModal: ({ type, title, form }: {
      type: string;
      title: string;
      form: TrainJob;
    }) => {
      const items = datasets.map((item: DataSet) => {
        return {
          value: item.id,
          label: item.name
        }
      }) || [];
      setIsModalOpen(true);
      setType(type);
      setTitle(title);
      setFormData(form);
      setDatasetItems(items as Option[]);
    }
  }));

  useEffect(() => {
    if (isModalOpen) {
      initializeForm();
    }
  }, [isModalOpen]);

  const initializeForm = useCallback(() => {
    if (!formRef.current) return;
    formRef.current.resetFields();

    if (type === 'add') {
      formRef.current.setFieldsValue({
        type: 'anomaly',
        algorithms: 'IsolationForest',
      });
    } else if (formData) {
      formRef.current.setFieldsValue({
        name: formData.name,
        type: formData.type,
        dataset_id: formData.dataset_id
      });
    }
  }, [type, formData]);

  const handleSubmit = useCallback(async () => {
    if (confirmLoading) return;
    setConfirmLoading(true);
    try {
      const value = await formRef.current?.validateFields();
      let result;
      if (type === 'add') {
        result = await supabase.from('anomaly_detection_train_jobs').insert([
          {
            tenant_id: user.app_metadata?.tenant_id,
            name: value.name,
            dataset_id: value.dataset_id,
            user_id: user.id
          }
        ]);
      } else {
        result = await supabase.from('anomaly_detection_train_jobs')
          .update({
            name: value.name,
            dataset_id: value.dataset_id
          })
          .eq('id', formData?.id);
      }
      if (result.error) {
        message.error(result.error.message);
        return;
      }
      setIsModalOpen(false);
      message.success(`datasets.${type}Success`)
      onSuccess();
    } catch (e) {
      console.log(e);
    } finally {
      setConfirmLoading(false);
    }
  }, [type, formData, onSuccess]);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <OperateModal
        title={t(`traintask.${title}`)}
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
        <Form
          ref={formRef}
          layout="vertical"
        >
          <Form.Item
            name='name'
            label={t('common.name')}
            rules={[{ required: true, message: t('common.inputMsg') }]}
          >
            <Input placeholder={t('common.inputMsg')} />
          </Form.Item>
          <Form.Item
            name='type'
            label={t('common.type')}
            rules={[{ required: true, message: t('common.inputMsg') }]}
          >
            <Select placeholder={t('common.inputMsg')} options={[
              { value: 'anomaly', label: t('datasets.anomaly') },
            ]} />
          </Form.Item>
          <Form.Item
            name='dataset_id'
            label={t('traintask.datasets')}
            rules={[{ required: true, message: t('traintask.selectDatasets') }]}
          >
            <Select placeholder={t('traintask.selectDatasets')} options={datasetItems} />
          </Form.Item>
        </Form>
      </OperateModal>
    </>
  );
};

export default TrainTaskModal;