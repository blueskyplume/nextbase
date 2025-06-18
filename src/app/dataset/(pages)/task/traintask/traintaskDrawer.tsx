import { Button, Drawer } from "antd";
import { ColumnItem, TableDataItem } from "@/types";
import CustomTable from "@/components/custom-table";
import { useTranslation } from "@/utils/i18n";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/utils/supabaseClient";

const TrainTaskDrawer = ({ open, onCancel, trainData }: { open: boolean, onCancel: () => void, trainData: any[] }) => {
  const { t } = useTranslation();
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    pageSize: 10,
  });

  // 使用 useCallback 缓存 renderColumns 函数
  const renderColumns = useCallback((params: Object) => {
    const data = Object.keys(params);
    return data.map((value, index) => ({
      title: value,
      key: `param-${value}-${index}`, // 确保 key 唯一
      dataIndex: value,
    }));
  }, []);

  // 使用 useCallback 缓存 expandedRowRender 函数
  const expandedRowRender = useCallback((record: any) => {
    return (
      <CustomTable
        rowKey="key"
        loading={record.loading}
        columns={renderColumns(record.parameters)}
        dataSource={[{ ...record.parameters, key: `params-${record.id}` }]}
        pagination={false}
        size="small"
      />
    );
  }, [renderColumns]);

  // 使用 useMemo 缓存 expandable 配置
  const expandableConfig = useMemo(() => ({
    expandedRowRender,
    rowExpandable: (record: any) => record.parameters && Object.keys(record.parameters).length > 0,
  }), [expandedRowRender]);

  const columns: ColumnItem[] = useMemo(() => [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120
    },
    {
      title: t('traintask.executionTime'),
      dataIndex: 'started_at',
      key: 'started_at',
      align: 'center',
      width: 150,
      render: (_, record) => (<p>{record?.started_at ? new Date(record?.started_at).toLocaleString() : '--'}</p>),
    },
    {
      title: t('traintask.executionStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 100
    },
    {
      title: t('traintask.executionScore'),
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (_, record) => (<p>{record?.score ? record?.score.toFixed(4) : '--'}</p>),
    },
    {
      title: t('traintask.traindata'),
      dataIndex: 'train_data_id',
      key: 'train_data_id',
      width: 100,
      render: (_, record) => (<p>{trainData?.find(item => item.id === record?.train_data_id)?.name || '--'}</p>)
    },
    {
      title: t('traintask.algorithms'),
      dataIndex: 'algorithms',
      key: 'algorithms',
      width: 100
    },
    {
      title: t('common.action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
        >
          {t('traintask.modelDownload')}
        </Button>
      ),
    }
  ], [t]);

  const getHistoryData = useCallback(async () => {
    setLoading(true);
    try {
      const from = (pagination.current - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      const { data, error, count } = await supabase
        .from('anomaly_detection_train_history')
        .select(`*, anomaly_detection_train_jobs (name)`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Failed to fetch history:', error);
        return;
      }

      if (data) {
        const processedData = data.map((item, index) => ({
          ...item,
          key: `history-${item.id || index}`, // 确保每行有唯一 key
          parameters: item.parameters ? JSON.parse(item.parameters) : {},
          name: item.anomaly_detection_train_jobs?.name || '',
          loading: false, // 修正字段名
        }));
        setTableData(processedData);
        setPagination(prev => ({
          ...prev,
          total: count || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      getHistoryData();
    }
  }, [open, pagination.current, pagination.pageSize]);

  const onChange = (value: any) => {
    setPagination(value);
  };

  return (
    <Drawer
      width={800}
      title={t('traintask.history')}
      open={open}
      onClose={onCancel}
      footer={
        <Button onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      }
    >
      <CustomTable
        rowKey="key"
        scroll={{ y: 'calc(100vh - 280px)' }}
        loading={loading}
        columns={columns}
        dataSource={tableData}
        expandable={expandableConfig}
        pagination={pagination}
        onChange={onChange}
      />
    </Drawer>
  );
};

export default TrainTaskDrawer;