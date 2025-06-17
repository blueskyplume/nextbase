'use client'
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Input, Popconfirm, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import CustomTable from '@/components/custom-table';
import sideMenuStyle from './index.module.scss';
import TrainTaskModal from './traintaskModal';
import { supabase } from '@/utils/supabaseClient';
import { ColumnItem } from '@/types';
import { User } from '@supabase/supabase-js';
import { ModalRef } from '@/types';
import TrainTaskDrawer from './traintaskDrawer';
import TrainDataModal from './traindataModal';
import { useTranslation } from '@/utils/i18n';
const { Search } = Input;

interface TrainTaskData {
  id: number;
  name: string;
  type: string;
  created_at: string;
  creator: string;
  [key: string]: any;
}

const TrainTask = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const modalRef = useRef<ModalRef>(null);
  const traindataRef = useRef<ModalRef>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tableData, setTableData] = useState<TrainTaskData[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    pageSize: 10,
  });

  const columns: ColumnItem[] = [
    {
      title: t('common.name'),
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: t('common.type'),
      key: 'type',
      dataIndex: 'type',
    },
    {
      title: t('common.createdAt'),
      key: 'created_at',
      dataIndex: 'created_at',
    },
    {
      title: t('common.creator'),
      key: 'creator',
      dataIndex: 'creator',
    },
    {
      title: t('common.status'),
      key: 'status',
      dataIndex: 'status',
    },
    {
      title: t('common.action'),
      key: 'action',
      dataIndex: 'action',
      width: 240,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: TrainTaskData) => (
        <>
          <Button
            type="link"
            className="mr-[10px]"
            onClick={() => handleTrainSelect(record)}
          >
            {t('traintask.train')}
          </Button>
          <Button
            type="link"
            className="mr-[10px]"
            onClick={() => setOpen(true)}
          >
            {t('traintask.history')}
          </Button>
          <Button
            type="link"
            className="mr-[10px]"
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('traintask.deleteTraintask')}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            onConfirm={() => onDelete(record)}
          >
            <Button type="link">{t('common.delete')}</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const Topsection = () => (
    <div className="mb-4 flex w-full gap-4">
      <div className="flex-1 flex flex-col justify-center h-[90px] p-4 rounded-lg bg-white shadow">
        <h1 className="text-lg font-bold text-gray-900 mb-1">训练任务</h1>
        <p className="text-xs text-gray-500">
          创建训练任务，对各个模型进行训练，训练完成后，可在模型库查看最终的模型。
        </p>
      </div>
    </div>
  );

  const pagedData = useMemo(() => {
    if (!tableData.length) return [];
    return tableData.slice(
      (pagination.current - 1) * pagination.pageSize,
      pagination.current * pagination.pageSize
    );
  }, [tableData, pagination.current, pagination.pageSize]);


  useEffect(() => {
    getTasks();
    getUser();
  }, []);

  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: tableData.length,
    }));
  }, [tableData]);

  // 示例数据获取（请替换为实际接口）
  const getTasks = async (search: string = '') => {
    setLoading(true);
    // TODO: 替换为实际接口
    // const data = await fetchTaskList();
    const data = [
      { id: 1, name: '任务A', type: '分类', created_at: '2024-06-01 10:00:00', creator: '张三', status: '训练中', dataset_id: 10 },
      { id: 2, name: '任务B', type: '回归', created_at: '2024-06-02 11:00:00', creator: '李四', status: '已完成', dataset_id: 10 },
    ];
    setTableData(data as TrainTaskData[]);
    setPagination(prev => ({
      ...prev,
      total: data?.length || 0,
    }));
    setLoading(false);
  };

  const fetchTaskList = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('anomaly_detection_train_jobs').select();
      return data;
    } finally {
      setLoading(false);
    }
  };

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      message.error(error.message);
      return;
    }
    setUser(data.user);
  };

  const handleAdd = () => {
    if (modalRef.current) {
      modalRef.current.showModal({
        type: 'add',
        title: 'addtask',
        form: {}
      })
    }
  };

  const handleEdit = (record: any) => {
    if (modalRef.current) {
      modalRef.current.showModal({
        type: 'edit',
        title: 'edittask',
        form: record
      })
    }
  }

  const handleTrainSelect = (record: any) => {
    if (traindataRef.current) {
      traindataRef.current.showModal({ type: '', form: { dataset_id: record?.dataset_id } })
    }
  };

  const handleChange = (value: any) => {
    setPagination(value);
  };

  const onSearch = (search: string) => {
    getTasks(search);
  };

  const onDelete = async (record: TrainTaskData) => {
    setLoading(true);
    // TODO: 调用删除接口
    message.success('删除成功');
    getTasks();
    setLoading(false);
  };

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <div className={`flex w-full h-full text-sm p-[20px] ${sideMenuStyle.sideMenuLayout} grow`}>
      <div className="w-full flex grow flex-1 h-full">
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className={`flex w-full rounded-md`}>
            <Topsection />
          </div>
          <div className="p-4 flex-1 rounded-lg bg-white shadow overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 gap-2">
              <button
                className="flex items-center py-2 px-4 rounded-md text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                onClick={() => router.back()}
              >
                <ArrowLeftOutlined className="mr-2" />
                返回
              </button>
              <div className="flex">
                <Search
                  className="w-[240px] mr-1.5"
                  placeholder="搜索任务名称"
                  enterButton
                  onSearch={onSearch}
                  style={{ fontSize: 15 }}
                />
                <Button type="primary" className="rounded-md text-xs shadow" onClick={() => handleAdd()}>
                  新建
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <CustomTable
                rowKey="id"
                className="mt-3"
                scroll={{ x: '100%', y: 'calc(100vh - 420px)' }}
                dataSource={pagedData}
                columns={columns}
                pagination={pagination}
                loading={loading}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>
      </div>
      <TrainTaskModal
        ref={modalRef}
        supabase={supabase}
        user={user as User}
        onSuccess={() => { }}
      />
      <TrainTaskDrawer open={open} onCancel={onCancel} />
      <TrainDataModal ref={traindataRef} supabase={supabase} user={user as User} onSuccess={() => { }} />
    </div>
  );
};

export default TrainTask;