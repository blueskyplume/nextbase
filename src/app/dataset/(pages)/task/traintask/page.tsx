'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useLocalizedTime } from "@/hooks/useLocalizedTime";
import { getName } from '@/utils/common';
import { Button, Input, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import CustomTable from '@/components/custom-table';
import TrainTaskModal from './traintaskModal';
import TrainTaskDrawer from './traintaskDrawer';
import TrainDataModal from './traindataModal';
import { useTranslation } from '@/utils/i18n';
import { ModalRef, ColumnItem, TrainJob, TrainTaskHistory, DataSet, TrainData } from '@/types';
import { User } from '@supabase/supabase-js';
import { TrainStatus, TrainText } from '@/constants';
import sideMenuStyle from './index.module.scss';
const { Search } = Input;

const getStatusColor = (value: string, TrainStatus: Record<string, string>) => {
  return TrainStatus[value] || '';
};

const getStatusText = (value: string, TrainText: Record<string, string>) => {
  return TrainText[value] || '';
};

const TrainTask = () => {
  const { t } = useTranslation();
  const { convertToLocalizedTime } = useLocalizedTime();
  const router = useRouter();
  const modalRef = useRef<ModalRef>(null);
  const traindataRef = useRef<ModalRef>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tableData, setTableData] = useState<TrainJob[]>([]);
  const [trainData, setTrainData] = useState<TrainData[]>([]);
  const [datasets, setDatasets] = useState<DataSet[]>([]);
  const [historyData, setHistoryData] = useState<TrainTaskHistory[]>([]);
  const [selectId, setSelectId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
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
      render: (_, record) => {
        return (<>{t(`datasets.${record.type}`)}</>)
      }
    },
    {
      title: t('common.createdAt'),
      key: 'created_at',
      dataIndex: 'created_at',
      render: (_, record) => {
        return (<p>{convertToLocalizedTime(record.created_at, 'YYYY-MM-DD HH:mm:ss')}</p>)
      }
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
      render: (_, record: TrainJob) => {
        return record.status ? (<Tag color={getStatusColor(record.status, TrainStatus)} className=''>
          {t(`traintask.${getStatusText(record.status, TrainText)}`)}
        </Tag>) : (<p>--</p>)
      }
    },
    {
      title: t('common.action'),
      key: 'action',
      dataIndex: 'action',
      width: 240,
      fixed: 'right',
      align: 'center',
      render: (_: unknown, record: TrainJob) => (
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
            onClick={() => handleEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            className="mr-[10px]"
            onClick={() => openHistortDrawer(record)}
          >
            {t('traintask.history')}
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
        <h1 className="text-lg font-bold text-gray-900 mb-1">{t('traintask.traintask')}</h1>
        <p className="text-xs text-gray-500">
          {t('traintask.description')}
        </p>
      </div>
    </div>
  );

  useEffect(() => {
    getTasks();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    getTrainData();
    getCurrentUser();
  }, []);

  const getTrainStatus = useCallback((targetID: string | number, data: any[] | null) => {
    if (data) {
      const filterArr = data.filter((item) => item.job_id === targetID).sort((a, b) => a.updated_at - b.updated_at);
      const target = filterArr[filterArr.length - 1]?.status;
      return target || '';
    }
    return '';
  }, []);

  const getTasks = async (search: string = '') => {
    setLoading(true);
    try {
      const { data, count } = await fetchTaskList(search, pagination.current, pagination.pageSize);
      const history = (await fetchHistory()) || [];
      const datasets = await getDataSets();
      console.log(datasets)
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id,first_name,last_name');
      const _data = data?.map((item) => ({
        id: item.id,
        name: item.name,
        type: 'anomaly',
        dataset_id: item.dataset_id,
        created_at: item.created_at,
        creator: getName(item?.user_id, users),
        status: getTrainStatus(item.id, history),
        user_id: item.user_id
      })) || [];
      setTableData(_data as TrainJob[]);
      setDatasets(datasets);
      setHistoryData(history);
      setPagination(prev => ({
        ...prev,
        total: count,
      }));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskList = useCallback(async (search: string = '', page: number = 1, pageSize: number = 10) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await supabase.from('anomaly_detection_train_jobs')
      .select(`*`, { count: 'exact' })
      .ilike('name', `%${search}%`)
      .range(from, to)
      .order('created_at', { ascending: false });
    return {
      data,
      count: count || 0
    }
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('anomaly_detection_train_history')
      .select(`*, anomaly_detection_train_jobs (name)`, { count: 'exact' })
      .order('created_at', { ascending: false });
    return data;
  };

  const getTrainData = async () => {
    try {
      const { data, error } = await supabase.from("anomaly_detection_train_data").select();
      if (!error) return setTrainData(data);
      message.error(error.message);
    } catch (e) {
      console.log(e);
    }
  };

  const getDataSets = async () => {
    const { data } = await supabase.from('anomaly_detection_datasets').select();
    if (data) return data;
    return [];
  };

  const getCurrentUser = async () => {
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

  const handleEdit = (record: TrainJob) => {
    if (modalRef.current) {
      modalRef.current.showModal({
        type: 'edit',
        title: 'edittask',
        form: record
      })
    }
  };

  const handleTrainSelect = (record: any) => {
    if (traindataRef.current) {
      traindataRef.current.showModal({ type: '', form: record });
    }
  };

  const openHistortDrawer = (record: TrainJob) => {
    setSelectId(record.id as number);
    setOpen(true);
  }

  const handleChange = (value: any) => {
    setPagination(value);
  };

  const onSearch = (search: string) => {
    getTasks(search);
  };

  const onDelete = async (record: TrainJob) => {
    try {
      await supabase.from('anomaly_detection_train_jobs')
        .delete()
        .eq('id', record.id);
    } catch (e) {
      console.log(e);
    } finally {
      message.success(t('common.successfullyDeleted'));
      getTasks();
    }
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
            <div className="flex justify-end items-center mb-4 gap-2">
              <div className="flex">
                <Search
                  className="w-[240px] mr-1.5"
                  placeholder={t('traintask.searchText')}
                  enterButton
                  onSearch={onSearch}
                  style={{ fontSize: 15 }}
                />
                <Button type="primary" icon={<PlusOutlined />} className="rounded-md text-xs shadow" onClick={() => handleAdd()}>
                  {t('common.add')}
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <CustomTable
                rowKey="id"
                className="mt-3"
                scroll={{ x: '100%', y: 'calc(100vh - 420px)' }}
                dataSource={tableData}
                columns={columns}
                pagination={pagination}
                loading={loading}
                onChange={handleChange}
              />
              <button
                className="flex absolute right-0 left-0 items-center py-2 px-4 rounded-md text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                onClick={() => router.back()}
              >
                <ArrowLeftOutlined className="mr-2 text-lg" />
              </button>
            </div>
          </div>
        </section>

      </div>
      <TrainTaskModal
        ref={modalRef}
        supabase={supabase}
        user={user as User}
        datasets={datasets}
        onSuccess={() => getTasks()}
      />
      <TrainTaskDrawer open={open} selectId={selectId} onCancel={onCancel} historyData={historyData} trainData={trainData} />
      <TrainDataModal ref={traindataRef} supabase={supabase} user={user as User} trainData={trainData} onSuccess={() => getTasks()} />
    </div>
  );
};

export default TrainTask;