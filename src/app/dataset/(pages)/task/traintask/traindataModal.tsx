"use client";
import OperateModal from '@/components/operate-modal';
import { Form, Input, Button, Select, FormInstance, message } from 'antd';
import { useState, useImperativeHandle, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from '@/utils/i18n';
// import { type TRAIN_STATUS } from '@/constants';
import { Option, TrainJob, AlgorithmParam, TrainDataModalProps } from '@/types';

const algorithmsParam: AlgorithmParam[] = [
  { name: 'n_estimators', type: 'value', default: 100 },
  { name: 'max_samples', type: 'value', default: 'auto' },
  { name: 'contamination', type: 'value', default: 'auto' },
  { name: 'max_features', type: 'value', default: 1.0 },
  { name: 'bootstrap', type: 'enum', default: 'False' },
  { name: 'n_jobs', type: 'value', default: 'None', },
  { name: 'random_state', type: 'value', default: 'None' },
  { name: 'verbose', type: 'value', default: 0 },
  { name: 'warm_start', type: 'enum', default: 'False' }
];

const TrainDataModal = ({ ref, supabase, user, onSuccess, trainData }: TrainDataModalProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectLoading, setSelectLoading] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [traindataOption, setTrainDataOption] = useState<Option[]>([]);
  const [formData, setFormData] = useState<TrainJob | null>(null);
  const traindataRef = useRef<FormInstance>(null);

  useImperativeHandle(ref, () => ({
    showModal: ({ form }: { form: TrainJob; }) => {
      setIsModalOpen(true);
      setFormData(form);
      const option: Option[] = trainData
        .filter(item => item.dataset_id === form?.dataset_id)
        .map((item) => ({
          label: item?.name,
          value: item?.id
        }));
      setTrainDataOption(option);
    }
  }));

  useEffect(() => {
    if (isModalOpen && traindataRef.current) {
      // 设置算法参数的默认值
      const defaultParams: Record<string, any> = {};
      algorithmsParam.forEach(item => {
        defaultParams[item.name] = item.default;
      });
      traindataRef.current.setFieldsValue({
        params: defaultParams
      });
    }
  }, [isModalOpen]);

  const renderItem = useCallback((param: AlgorithmParam[]) => {
    return param.map((item) => (
      <Form.Item key={item.name} name={['params', item.name]} label={item.name} rules={[{ required: true, message: t('common.inputMsg') }]}>
        {item.type === 'value' ? <Input /> :
          <Select
            options={[
              { value: 'False', label: 'False' },
              { value: 'True', label: 'True' },
            ]}
          />
        }
      </Form.Item>
    )
    )
  }, [t]);

  const handleSubmit = useCallback(async () => {
    if (confirmLoading) return;
    setConfirmLoading(true);
    try {
      const data = await traindataRef.current?.validateFields();
      const { error } = await supabase
        .from('anomaly_detection_train_history')
        .insert([
          {
            tenant_id: user.app_metadata.tenant_id,
            job_id: formData?.id,
            train_data_id: data.train_data_id,
            parameters: JSON.stringify(data.params),
            status: 'not_started',
            user_id: user.id
          }
        ]);
      if (error) return message.error(error.message);
      message.success(t('common.createdSuccess'));
      setIsModalOpen(false);
      onSuccess();
    } catch (e) {
      console.log(e);
    } finally {
      setConfirmLoading(false);
    }
  }, [user, formData]);

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <OperateModal
      title={t(`traintask.selectTraindata`)}
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
      <Form ref={traindataRef} layout="vertical">
        <Form.Item
          name='train_data_id'
          label={t('traintask.trainfile')}
          rules={[{ required: true, message: t('common.inputMsg') }]}
        >
          <Select placeholder={t('common.inputMsg')} loading={selectLoading} options={traindataOption} />
        </Form.Item>
        <Form.Item
          name='algorithms'
          label={t('traintask.algorithms')}
          rules={[{ required: true, message: t('common.inputMsg') }]}
        >
          <Select placeholder={t('common.inputMsg')} onChange={(value) => { console.log(value) }} options={[
            { value: 'IsolationForst', label: t(`traintask.IsolationForst`) },
          ]} />
        </Form.Item>
        {renderItem(algorithmsParam)}
      </Form>
    </OperateModal>
  )
};

export default TrainDataModal;