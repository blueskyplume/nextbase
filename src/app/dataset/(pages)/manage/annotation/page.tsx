"use client";
import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { Button, message, Spin, TablePaginationConfig } from "antd";
import { cloneDeep } from "lodash";
import { supabase } from "@/utils/supabaseClient";
import Aside from "./components/aside";
import Icon from '@/components/icon';
import LineChart from "@/components/charts/lineChart";
import CustomTable from "@/components/custom-table";
import { ColumnItem, AnomalyTrainData, TableDataItem, Pagination, LabelData } from '@/types';
import { useLocalizedTime } from "@/hooks/useLocalizedTime";
import { useTranslation } from "@/utils/i18n";
import { exportToCSV } from "@/utils/common";
import '@ant-design/v5-patch-for-react-19';
import sideMenuStyle from './components/index.module.scss';

const AnnotationIntro = memo(() => {
  const { t } = useTranslation();
  return (
    <div className="flex h-[58px] flex-col items-center justify-center">
      <div className='flex justify-center mb-2'>
        <Icon
          type="shiyongwendang"
          className="mr-2"
          style={{ height: '22px', width: '22px', color: 'blue' }}
        ></Icon>
        <h1 className="text-center text-lg leading-[24px]">{t('traintask.datasets')}</h1>
      </div>
    </div>
  );
});

const Topsection = memo(() => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[90px] p-4 overflow-hidden">
      <h1 className="text-lg font-bold text-gray-900 mb-1">{t('datasets.title')}</h1>
      <p className="text-xs overflow-hidden w-full min-w-[1000px] text-gray-500 mt-[8px]">
        {t('datasets.detail')}
      </p>
    </div>
  );
});

const AnnotationPage = () => {
  const searchParams = useSearchParams();
  const file_id = searchParams.get('id');
  const { t } = useTranslation();
  const { convertToLocalizedTime } = useLocalizedTime();
  const [menuItems, setMenuItems] = useState<AnomalyTrainData[]>([]);
  const [tableData, setTableData] = useState<TableDataItem[]>([]);
  const [currentFileData, setCurrentFileData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  // const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [isChange, setIsChange] = useState<boolean>(false);
  const [flag, setFlag] = useState<boolean>(true);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const [timeline, setTimeline] = useState<any>({
    startIndex: 0,
    endIndex: 0,
  });

  const colmuns: ColumnItem[] = useMemo(() => {
    return [
      {
        title: t('common.time'),
        key: 'timestamp',
        dataIndex: 'timestamp',
        width: 100,
        align: 'center',
        render: (_, record) => {
          const time = new Date(record.timestamp * 1000).toISOString();
          return <p>{convertToLocalizedTime(time.toString(), 'YYYY-MM-DD HH:mm:ss')}</p>;
        },
      },
      {
        title: t('datasets.value'),
        key: 'value',
        dataIndex: 'value',
        align: 'center',
        width: 40,
        render: (_, record) => {
          const value = Number(record.value).toFixed(2);
          return <p>{value}</p>
        },
      },
      {
        title: t('datasets.labelResult'),
        key: 'label',
        dataIndex: 'label',
        width: 100,
        align: 'center',
        hidden: true
      },
      {
        title: t('common.action'),
        key: 'action',
        dataIndex: 'action',
        align: 'center',
        width: 40,
        render: (_, record) => {
          return (
            <Button color="danger" variant="link" onClick={() => handleDelete(record)}>
              {t('common.delete')}
            </Button>
          )
        }
      }
    ];
  }, [t, convertToLocalizedTime]);

  const pagedData = useMemo(() => {
    if (!tableData.length) return [];
    return tableData.slice(
      (pagination.current! - 1) * pagination.pageSize!,
      pagination.current! * pagination.pageSize!
    );
  }, [tableData, pagination.current, pagination.pageSize]);

  useEffect(() => {
    getCurrentFileData();
  }, [searchParams]);

  useEffect(() => {
    setPagination((prev) => {
      return {
        ...prev,
        total: tableData.length
      }
    });
  }, [tableData]);

  useEffect(() => {
    if (currentFileData.length && flag) {
        setTimeline({
          startIndex: 0,
          endIndex: currentFileData.length > 10 ? Math.floor(currentFileData.length / 10) : (currentFileData.length > 1 ? currentFileData.length - 1 : 0)
        });
        setFlag(false);
    }
  }, [currentFileData]);

  const fileReader = (text: string) => {
    // 统一换行符为 \n
    const lines = text.replace(/\r\n|\r|\n/g, '\n')?.split('\n').filter(line => line.trim() !== '');
    if (!lines.length) {
      setTableData([]);
      return [];
    }
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj: Record<string, any>, key, idx) => {
        obj[key] = key === 'timestamp'
          ? new Date(values[idx]).getTime() / 1000
          : Number(values[idx]);
        return obj;
      }, {});
    });
    if (headers.includes('label')) {
      const _data = data.filter((item) => item.label === 1);
      setTableData(_data);
      setPagination((prev) => ({
        ...prev,
        total: _data.length
      }));
    } else {
      setTableData([]);
      setPagination({
        current: 1,
        total: 0,
        pageSize: 20
      });
    }
    return data;
  };

  const getCurrentFileData = useCallback(async () => {
    setLoading(true);
    setChartLoading(true);
    // setTableLoading(true);
    const id = searchParams.get('id');
    const folder_id = searchParams.get('folder_id');
    const fileList = await supabase.from('anomaly_detection_train_data').select().eq('dataset_id', folder_id);

    if (fileList.data) {
      const item = fileList.data.find((k: any) => k.id == id);
      const fileData = await supabase.storage.from('datasets').download(item.storage_path + `?t=${Date.now()}`);
      setMenuItems(fileList.data);
      setLoading(false);
      const text = await fileData.data?.text();
      const data = fileReader(text as string);
      setCurrentFileData(data);
      setChartLoading(false);
      // setTableLoading(false);
    } else if (fileList.error) {
      message.error(fileList.error.message);
    }
  }, [searchParams, supabase]);

  const onXRangeChange = useCallback((data: any[]) => {
    if (!isChange) setIsChange(true);
    setChartLoading(true);
    if (!currentFileData.length) {
      setChartLoading(false);
      return;
    }
    try {
      const minTime = data[0].unix();
      const maxTime = data[1].unix();
      let newData;
      if (minTime === maxTime) {
        newData = currentFileData.map((item: any) =>
          item.timestamp === minTime ? { ...item, label: 1 } : item
        );
        setCurrentFileData(newData);
      } else {
        newData = currentFileData.map((item: any) =>
          item.timestamp >= minTime && item.timestamp <= maxTime
            ? { ...item, label: 1 }
            : item
        );
      }
      const _tableData = newData.filter((item: any) => item.label === 1);
      setTableData(_tableData);
      setCurrentFileData(newData);
    } finally {
      setChartLoading(false);
    }
  }, [currentFileData]);

  const onAnnotationClick = useCallback((value: any[]) => {
    if (!value) return;
    if (!isChange) setIsChange(true);
    setChartLoading(true);
    try {
      const _data: any[] = cloneDeep(currentFileData);
      value.map((item: any) => {
        const index = _data.findIndex((k) => k.timestamp === item.timestamp);
        _data.splice(index, 1, {
          ...item,
          label: item.label ? 0 : 1
        })
      });
      const _tableData = _data.filter((item: any) => item.label === 1);
      setTableData(_tableData);
      setCurrentFileData(_data);
    } finally {
      setChartLoading(false);
    }
  }, [currentFileData]);

  const handleChange = (value: TablePaginationConfig) => {
    setPagination((prev) => {
      return {
        current: value.current as number,
        pageSize: value.pageSize as number,
        total: prev.total as number,
      }
    })
  };

  const handleDelete = useCallback((record: ColumnItem) => {
    setIsChange(true);
    setChartLoading(true);
    // setTableLoading(true);
    try {
      const newData = currentFileData.map((item: any) =>
        item.timestamp === record.timestamp ? { ...item, label: 0 } : item
      );
      const _tableData = newData.filter((item: any) => item.label === 1);
      setCurrentFileData(newData);
      setTableData(_tableData);
    } finally {
      setChartLoading(false);
      // setTableLoading(false);
    }
  }, [currentFileData]);

  const handleSava = useCallback(async () => {
    setSaveLoading(true);
    try {
      const { data } = await supabase.from('anomaly_detection_train_data').select().eq('id', file_id);
      if (data?.length) {
        const name = data[0].name;
        const filepath = data[0].storage_path;
        const blob = exportToCSV(currentFileData, colmuns.slice(0, colmuns.length - 1), name);
        const updateFile = await supabase.storage.from('datasets').update(filepath, blob, {
          cacheControl: '3600',
          upsert: true
        });

        if (updateFile.error) {
          return message.error(updateFile.error.message);
        }

        await supabase.from('anomaly_detection_train_data').update({
          metadata: JSON.stringify({
            length: tableData.length
          })
        }).eq('id', file_id);
        message.success(t('datasets.saveSuccess'));
        getCurrentFileData();
      } else {
        message.error(t('datasets.saveError'));
      }
    } finally {
      setSaveLoading(false);
      setIsChange(false);
    }
  }, [supabase, currentFileData, colmuns]);

  const handleCancel = () => {
    getCurrentFileData();
    setIsChange(false);
  };

  const onTimeLineChange = (value: any) => {
    setTimeline(value);
  };

  return (
    <div className={`flex w-full h-full text-sm p-[10px] ${sideMenuStyle.sideMenuLayout} grow`}>
      <div className="w-full flex grow flex-1 h-full">
        <Aside
          loading={loading}
          menuItems={menuItems}
          isChange={isChange}
        >
          <AnnotationIntro />
        </Aside>
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className={`mb-4 w-full rounded-md ${sideMenuStyle.sectionContainer}`}>
            <Topsection />
          </div>
          <div className={`py-4 pr-4 flex-1 rounded-md overflow-auto ${sideMenuStyle.sectionContainer} ${sideMenuStyle.sectionContext}`}>
            <div className="flex justify-end gap-2 mb-4">
              <Button className="mr-4" onClick={handleCancel}>{t('common.cancel')}</Button>
              <Button type="primary" loading={saveLoading} onClick={handleSava}>{t('common.save')}</Button>
            </div>
            <Spin className="w-full" spinning={chartLoading}>
              <div className="flex justify-between">
                <div className="w-[66%]" style={{ height: `calc(100vh - 260px)` }}>
                  <LineChart
                    data={currentFileData}
                    timeline={timeline}
                    showDimensionTable
                    showDimensionFilter
                    onXRangeChange={onXRangeChange}
                    onTimeLineChange={onTimeLineChange}
                    onAnnotationClick={onAnnotationClick}
                  />
                </div>
                <div className="w-[32%]" style={{ height: `calc(100vh - 260px)` }}>
                  <CustomTable
                    size="small"
                    rowKey="timestamp"
                    scroll={{ y: 'calc(100vh - 330px)' }}
                    pageStyle="absolute right-0 flex justify-end mt-[5px]"
                    columns={colmuns}
                    dataSource={pagedData}
                    // loading={tableLoading}
                    pagination={pagination}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </Spin>
          </div>
        </section>
      </div>
    </div>
  )
};

export default AnnotationPage;