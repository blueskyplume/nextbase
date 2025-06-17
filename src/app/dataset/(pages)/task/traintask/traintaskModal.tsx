"use client";
import OperateModal from '@/components/operate-modal';
import { Form, Input, Button, Select, FormInstance, message } from 'antd';
import { useState, useImperativeHandle, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '@/utils/i18n';
import { SupabaseClient, User } from '@supabase/supabase-js';
import '@ant-design/v5-patch-for-react-19';

interface TrainTaskModalProps {
  supabase: SupabaseClient;
  user: User;
  // options: any,
  onSuccess: () => void;
  [key: string]: any
}

interface DatasetProp {
  id: string | number;
  tenant_id: string | number;
  dataset_id: string | number;
  storage_path: string | number;
  user_id: string | number;
  name: string;
  [key: string]: any
}

const TrainTaskModal = ({ ref, supabase, user, options, onSuccess }: TrainTaskModalProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [type, setType] = useState<string>('add');
  const [title, setTitle] = useState<string>('addtask');
  const [datasets, setDatasets] = useState<DatasetProp[]>([]);
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
      console.log(form)
    }
  }));

  const datasetItems = useMemo(() => {
    return datasets?.map((item) => {
      return {
        value: item.id,
        label: item.name
      }
    }) || [];
  }, [datasets])

  useEffect(() => {
    if (isModalOpen && formRef.current) {
      formRef.current?.resetFields();
      getDataSets();

      if (type === 'add') {
        formRef.current?.setFieldsValue({
          type: 'anomaly',
          algorithms: 'IsolationForst',
        });
        return;
      }
      formRef.current.setFieldsValue({
        ...formData
      })
    }
  }, [formData, isModalOpen]);

  const getDataSets = async () => {
    const { data } = await supabase.from('anomaly_detection_datasets').select();
    setDatasets(data as DatasetProp[]);
  };

  const handleSubmit = async () => {
    setConfirmLoading(true);
    try {
      const value = await formRef.current?.validateFields();
      // const data = formRef.current?.getFieldsValue();
      // const taskParam = {
      //   tenant_id: user.app_metadata?.tenant_id,
      //   name: data.name,

      // }
      console.log(value);
    } catch (e) {
      console.log(e)
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
              { value: 'anomaly', label: '单指标检测异常' },
            ]} />
          </Form.Item>
          <Form.Item
            name='dataset_id'
            label={t('traintask.datasets')}
            rules={[{ required: true, message: t('traintask.selectDatasets') }]}
          >
            <Select placeholder={t('traintask.selectDatasets')} options={datasetItems} />
          </Form.Item>
          <Form.Item
            name='algorithms'
            label={t('traintask.algorithms')}
            rules={[{ required: true, message: t('common.inputMsg') }]}
          >
            <Select placeholder={t('common.inputMsg')} onChange={(value) => { console.log(value) }} options={[
              { value: 'IsolationForst', label: '孤立森林' },
            ]} />
          </Form.Item>
        </Form>
      </OperateModal>
    </>
  )
};

export default TrainTaskModal;