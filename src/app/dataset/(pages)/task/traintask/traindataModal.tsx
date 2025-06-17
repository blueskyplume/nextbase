"use client";
import OperateModal from '@/components/operate-modal';
import { Form, Input, Button, Select, Typography, FormInstance, message } from 'antd';
import { useState, useImperativeHandle, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from '@/utils/i18n';
import { SupabaseClient, User } from '@supabase/supabase-js';
const { Paragraph } = Typography;

interface TrainTaskModalProps {
  supabase: SupabaseClient;
  user: User;
  options?: any;
  onSuccess: () => void;
  [key: string]: any
}

interface AlgorithmParam {
  name: string;
  type: 'value' | 'enum';
  default: string | number;
}

interface TrainData {
  id: string | number;
  name: string;
  dataset_id: string | number;
}

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

const TrainDataModal = ({ ref, supabase, user, options, onSuccess }: TrainTaskModalProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [traindataList, setTrainDataList] = useState<TrainData[]>([]);
  const [selectLoading, setSelectLoading] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const traindataRef = useRef<FormInstance>(null);

  useImperativeHandle(ref, () => ({
    showModal: ({ form }: { form: any; }) => {
      setIsModalOpen(true);
      if (form?.dataset_id) {
        getTrainData(form.dataset_id);
      }
    }
  }));

  const traindataOption = useMemo(() => {
    if (!traindataList.length) return [];
    return traindataList.map((item) => ({
      label: item?.name,
      value: item?.id
    }))
  }, [traindataList]);

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

  const getTrainData = useCallback(async (dataset_id: string | number) => {
    if (!dataset_id) return;

    setSelectLoading(true);
    try {
      const { data } = await supabase
        .from('anomaly_detection_train_data')
        .select('id, name, dataset_id')
        .eq('dataset_id', dataset_id);

      setTrainDataList(data || []);
    } catch (err) {
      message.error(t('common.error'));
    } finally {
      setSelectLoading(false);
    }
  }, [supabase, t]);

  const renderItem = useCallback((param: any[]) => {
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

  const handleSubmit = async () => {
    setConfirmLoading(true);
    try {
      const data = await traindataRef.current?.validateFields();
      console.log(user)
      console.log(data);
    } catch (e) {
      console.log(e);
    } finally {
      setConfirmLoading(false);
    }
  };

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
          name='traindata_id'
          label={t('traintask.trainfile')}
          rules={[{ required: true, message: t('common.inputMsg') }]}
        >
          <Select placeholder={t('common.inputMsg')} loading={selectLoading} options={traindataOption} />
        </Form.Item>
        {renderItem(algorithmsParam)}
      </Form>
    </OperateModal>
  )
};

export default TrainDataModal;