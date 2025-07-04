'use client'
import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { useTranslation } from '@/utils/i18n';
import CustomTable from '@/components/custom-table';
import { Button, Input, Popconfirm, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import '@ant-design/v5-patch-for-react-19';
import Icon from '@/components/icon';
import UploadModal from './uploadModal';
import { ColumnItem, ModalRef, Pagination, TableData } from '@/types';
import sideMenuStyle from './index.module.scss';
const { Search } = Input;

const Topsection = memo(({
  folder_name,
  description,
  t
}: {
  folder_name: string;
  description: string;
  t: (id: string) => string
}) => {
  return (
    <div className="mb-4 flex w-full gap-4">
      <div className="w-[216px] rounded-lg flex h-[90px] flex-col items-center justify-center bg-white shadow">
        <div className="flex justify-center items-center w-full">
          <Icon
            type="chakanshuji"
            className="mr-2"
            style={{ height: '22px', width: '22px', color: '#1976d2' }}
          />
          <h1 className="text-lg text-center font-bold leading-[24px] text-gray-800 max-w-[50%] truncate">{folder_name}</h1>
        </div>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="flex-1 flex flex-col justify-center h-[90px] p-4 rounded-lg bg-white shadow">
        <h1 className="text-lg font-bold text-gray-900 mb-1">{t('datasets.title')}</h1>
        <p className="text-xs text-gray-500">
          {t('datasets.detail')}
        </p>
      </div>
    </div>
  );
});

const Detail = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const modalRef = useRef<ModalRef>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    total: 0,
    pageSize: 10,
  });

  const {
    folder_id,
    folder_name,
    description
  } = useMemo(() => ({
    folder_id: searchParams.get('folder_id'),
    folder_name: searchParams.get('folder_name') || '',
    description: searchParams.get('description') || ''
  }), [searchParams]);

  const columns: ColumnItem[] = useMemo(() => [
    {
      title: t('common.name'),
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: t('datasets.anomalyTitle'),
      key: 'anomaly',
      dataIndex: 'anomaly',
      render(_, record) {
        const obj = JSON.parse(record?.metadata);
        return (
          <>
            {
              obj?.length || '--'
            }
          </>
        )
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      dataIndex: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record) => (
        <>
          <Button
            type="link"
            className="mr-[10px]"
            onClick={() => toAnnotation(record)}
          >
            {t('datasets.annotate')}
          </Button>
          <Popconfirm
            title={t('datasets.deleteTitle')}
            description={t('datasets.deleteContent')}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ loading: confirmLoading }}
            onConfirm={() => onDelete(record)}
          >
            <Button type="link">
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ], [t]);



  useEffect(() => {
    getDataset();
  }, [pagination.current, pagination.pageSize]);

  const getDataset = useCallback(async (search: string = '') => {
    setLoading(true);
    const from = (pagination.current - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    const { data, count } = await supabase.from('anomaly_detection_train_data')
      .select(`*`, { count: 'exact' })
      .eq('dataset_id', searchParams.get('folder_id'))
      .ilike('name', `%${search}%`)
      .range(from, to);
    setTableData(data as TableData[]);
    setPagination((prev) => {
      return {
        ...prev,
        total: count || 0
      }
    });
    setLoading(false);
  }, [t, searchParams]);

  const onSearch = (search: string) => {
    getDataset(search);
  };

  const onUpload = () => {
    const data = {
      dataset_id: searchParams.get('folder_id'),
      folder: searchParams.get('folder_name'),
    };
    modalRef.current?.showModal({ type: 'edit', form: data });
  };

  const onDelete = async (data: any) => {
    setConfirmLoading(true);
    const { error } = await supabase.storage
      .from('datasets')
      .remove([data.storage_path]);
    if (error) return message.error(error.message);
    await supabase.from('anomaly_detection_train_data').delete().eq('id', data.id);
    setConfirmLoading(false);
    getDataset();
  };

  const toAnnotation = (data: any) => {
    router.push(`/dataset/manage/annotation?id=${data.id}&folder_id=${folder_id}&folder_name=${folder_name}&description=${description}`);
  };

  const handleChange = (value: any) => {
    setPagination(value)
  };

  return (
    <>
      <div className={`flex w-full h-full text-sm p-[20px] ${sideMenuStyle.sideMenuLayout} grow`}>
        <div className="w-full flex grow flex-1 h-full">
          <section className="flex-1 flex flex-col overflow-hidden">
            <div className={`flex w-full rounded-md`}>
              <Topsection folder_name={folder_name} description={description} t={t} />
            </div>
            <div className={`p-4 flex-1 rounded-lg bg-white shadow overflow-hidden flex flex-col`}>
              <div className="flex justify-end items-center mb-4 gap-2">
                <div className='flex'>
                  <Search
                    className="w-[240px] mr-1.5"
                    placeholder={t('common.search')}
                    enterButton
                    onSearch={onSearch}
                    style={{ fontSize: 15 }}
                  />
                  <Button type="primary" className="rounded-md text-xs shadow" onClick={onUpload}>
                    {t("datasets.upload")}
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
                  className="absolute bottom-0 left-0 flex items-center py-2 px-4 rounded-md text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600"
                  onClick={() => router.push('/dataset/manage')}
                >
                  <ArrowLeftOutlined className="mr-2 text-lg" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <UploadModal ref={modalRef} onSuccess={() => getDataset()} />
    </>
  )
};

export default Detail;