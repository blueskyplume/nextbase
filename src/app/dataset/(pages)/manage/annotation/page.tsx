"use client";
import { supabase } from "@/utils/supabaseClient";
import Aside from "./components/aside";
import sideMenuStyle from './components/index.module.scss';
import Icon from '@/components/icon';
import { ColumnItem } from '@/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from "react";
import LineChart from "@/components/charts/lineChart";
import CustomTable from "@/components/custom-table";
import { useLocalizedTime } from "@/hooks/useLocalizedTime";
import { Button, message, Spin, TablePaginationConfig } from "antd";
import { exportToCSV } from "@/utils/common";
import '@ant-design/v5-patch-for-react-19';
import { cloneDeep } from "lodash";

const AnnotationPage = () => {
  const searchParams = useSearchParams();
  const file_id = searchParams.get('id');
  // const folder_name = searchParams.get('folder_name');
  const { convertToLocalizedTime } = useLocalizedTime();
  const [menuItems, setMenuItems] = useState<any>([]);
  const [tableData, setTableData] = useState<any>([]);
  // const [pagedData, setPageData] = useState<any>([]);
  const [currentFileData, setCurrentFileData] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [flag, setFlag] = useState<boolean>(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    total: 0,
    pageSize: 20,
  });
  const [timeline, setTimeline] = useState<any>({
    startIndex: 0,
    endIndex: 0,
  });

  const AnnotationIntro = () => {
    const name = '数据集';
    return (
      <div className="flex h-[58px] flex-col items-center justify-center">
        <div className='flex justify-center mb-2'>
          <Icon
            type="shiyongwendang"
            className="mr-2"
            style={{ height: '22px', width: '22px', color: 'blue' }}
          ></Icon>
          <h1 className="text-center text-lg leading-[24px]">{name}</h1>
        </div>
      </div>
    );
  };

  const Topsection = () => {
    const getTitle = () => {
      return '文档列表';
    };
    return (
      <div className="flex flex-col h-[90px] p-4 overflow-hidden">
        <h1 className="text-lg font-bold text-gray-900 mb-1">{getTitle()}</h1>
        <p className="text-xs overflow-hidden w-full min-w-[1000px] text-gray-500 mt-[8px]">
          {'支持上传时序数据，并为这些数据进行打标，以便后续进行模型训练。'}
        </p>
      </div>
    );
  };

  const colmuns: ColumnItem[] = [
    {
      title: '时间',
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
      title: '值',
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
      title: '标注结果',
      key: 'label',
      dataIndex: 'label',
      width: 100,
      align: 'center',
      hidden: true
    },
    {
      title: '操作',
      key: 'action',
      dataIndex: 'action',
      align: 'center',
      width: 40,
      render: (_, record) => {
        return (
          <Button color="danger" variant="link" onClick={() => handleDelete(record)}>
            删除
          </Button>
        )
      }
    }
  ];

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
    if (currentFileData.length) {
      if (flag) {
        setFlag(false);
        return;
      }
      setTimeline({
        startIndex: 0,
        endIndex: currentFileData.length > 10 ? Math.floor(currentFileData.length / 10) : (currentFileData.length > 1 ? currentFileData.length - 1 : 0)
      });
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
  }

  const getCurrentFileData = async () => {
    setLoading(true);
    setChartLoading(true);
    setTableLoading(true);
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
      setTableLoading(false);
    } else if (fileList.error) {
      message.error(fileList.error.message)
    }

  };

  const onXRangeChange = (data: any[]) => {
    console.log('test')
    setFlag(true);
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
  };

  const onAnnotationClick = (value: any[]) => {
    if (!value) return;
    setFlag(true);
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
  };

  const handleChange = (value: any) => {
    setPagination((prev) => {
      return {
        current: value.current,
        pageSize: value.pageSize,
        total: prev.total,
      }
    })
  };

  const handleDelete = (record: any) => {
    setFlag(true);
    setChartLoading(true);
    setTableLoading(true);
    try {
      const newData = currentFileData.map((item: any) =>
        item.timestamp === record.timestamp ? { ...item, label: 0 } : item
      );
      const _tableData = newData.filter((item: any) => item.label === 1);
      setCurrentFileData(newData);
      setTableData(_tableData);
    } finally {
      setChartLoading(false);
      setTableLoading(false);
    }
  };

  const handleSava = async () => {
    setSaveLoading(true);
    try {
      const { data, error } = await supabase.from('anomaly_detection_train_data').select().eq('id', file_id);
      if (data?.length) {
        const name = data[0].name;
        const filepath = data[0].storage_path;
        console.log(currentFileData)
        const blob = exportToCSV(currentFileData, colmuns.slice(0, colmuns.length - 1), name);
        const updateFile = await supabase.storage.from('datasets').update(filepath, blob, {
          cacheControl: '3600',
          upsert: true
        });
        if (updateFile.error) {
          console.log(updateFile.error);
          return;
        }
        const updateRowData = await supabase.from('anomaly_detection_train_data').update({
          metadata: JSON.stringify({
            length: tableData.length
          })
        }).eq('id', file_id);
        message.success('保存成功');
        getCurrentFileData();
      } else {
        message.error('保存出错');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    getCurrentFileData();
  };

  const onTimeLineChange = (value: any) => {
    setTimeline(value);
  }

  return (
    <div className={`flex w-full h-full text-sm p-[10px] ${sideMenuStyle.sideMenuLayout} grow`}>
      <div className="w-full flex grow flex-1 h-full">
        <Aside
          loading={loading}
          menuItems={menuItems}
        >
          <AnnotationIntro />
        </Aside>
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className={`mb-4 w-full rounded-md ${sideMenuStyle.sectionContainer}`}>
            <Topsection />
          </div>
          <div className={`py-4 pr-4 flex-1 rounded-md overflow-auto ${sideMenuStyle.sectionContainer} ${sideMenuStyle.sectionContext}`}>
            <div className="flex justify-end gap-2 mb-4">
              <Button className="mr-4" onClick={handleCancel}>取消</Button>
              <Button type="primary" loading={saveLoading} onClick={handleSava}>保存</Button>
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
                    loading={tableLoading}
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