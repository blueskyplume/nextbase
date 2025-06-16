import { Button, Drawer } from "antd";
import { ColumnItem, TableDataItem } from "@/types";
import CustomTable from "@/components/custom-table";
import { useTranslation } from "@/utils/i18n";
import { useState, useRef } from "react";

const TrainTaskDrawer = ({ open, onCancel }: { open: boolean, onCancel: () => void }) => {
  const { t } = useTranslation();
  const [childrenOpen, setChildrenOpen] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableDataItem[]>([
    {
      key: '1',
      name: '单指标异常检测',
      type: '单指标异常检测',
      started_at: '2024-01-15 14:30:25',
      status: '已完成',
      score: 0.95,
      tarindata: '数据集1',
      algorithm: '孤立森林',
      params: {
        "n_estimators": 100,
        "max_samples": "auto",
        "contamination": "auto",
        "max_features": 1,
        "bootstrap": "False",
        "n_jobs": "None",
        "random_state": "None",
        "verbose": 0,
        "warm_start": "False"
      }
    },
    {
      key: '2',
      name: '单指标异常检测',
      type: '单指标异常检测',
      started_at: '2024-01-15 14:30:25',
      status: '已完成',
      score: 0.95,
      tarindata: '数据集1',
      algorithm: '孤立森林',
      params: {
        "n_estimators": 100,
        "max_samples": "auto",
        "contamination": "auto",
        "max_features": 1,
        "bootstrap": "False",
        "n_jobs": "None",
        "random_state": "None",
        "verbose": 0,
        "warm_start": "False"
      }
    },
    {
      key: '3',
      name: '单指标异常检测',
      type: '单指标异常检测',
      started_at: '2024-01-15 14:30:25',
      status: '已完成',
      score: 0.95,
      tarindata: '数据集1',
      algorithm: '孤立森林',
      params: {
        "n_estimators": 100,
        "max_samples": "auto",
        "contamination": "auto",
        "max_features": 1,
        "bootstrap": "False",
        "n_jobs": "None",
        "random_state": "None",
        "verbose": 0,
        "warm_start": "False"
      }
    },
    {
      key: '4',
      name: '单指标异常检测',
      type: '单指标异常检测',
      started_at: '2024-01-15 14:30:25',
      status: '已完成',
      score: 0.95,
      tarindata: '数据集1',
      algorithm: '孤立森林',
      params: {
        "n_estimators": 100,
        "max_samples": "auto",
        "contamination": "auto",
        "max_features": 1,
        "bootstrap": "False",
        "n_jobs": "None",
        "random_state": "None",
        "verbose": 0,
        "warm_start": "False"
      }
    },
    {
      key: '5',
      name: '单指标异常检测',
      type: '单指标异常检测',
      started_at: '2024-01-15 14:30:25',
      status: '已完成',
      score: 0.95,
      tarindata: '数据集1',
      algorithm: '孤立森林',
      params: {
        "n_estimators": 100,
        "max_samples": "auto",
        "contamination": "auto",
        "max_features": 1,
        "bootstrap": "False",
        "n_jobs": "None",
        "random_state": "None",
        "verbose": 0,
        "warm_start": "False"
      }
    },
  ]);
  const columns: ColumnItem[] = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      // fixed: 'left',
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
      width: 150
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
      width: 100
    },
    {
      title: t('traintask.traindata'),
      dataIndex: 'traindata',
      key: 'traindata',
      width: 100
    },
    {
      title: t('traintask.algorithms'),
      dataIndex: 'algorithms',
      key: 'algorithms',
      width: 100
    },
    {
      title: t('common.action'),
      key: 'action',
      dataIndex: 'action',
      width: 120,
      align: 'center',
      // fixed: 'right',
      render: (_, record) => {
        return (
          <>
            <Button type="link">{t('traintask.modelDownload')}</Button>
          </>
        )
      },
    }
  ];

  const renderColumns = (params: Object) => {
    const data = Object.keys(params);
    return data.map(value => ({
      title: value,
      key: value,
      dataIndex: value
    }))
  };

  const showDrawer = () => {
    setChildrenOpen(true);
  };

  const onClose = () => {
    setChildrenOpen(false);
  };

  return (
    <>
      <Drawer
        width={800}
        title={t('traintask.history')}
        open={open}
        onClose={onCancel}
        footer={(
          <Button onClick={onCancel}>{t('common.cancel')}</Button>
        )}
      >
        <CustomTable
          scroll={{ y: 'calc(100vh - 250px)' }}
          columns={columns}
          dataSource={tableData}
          expandable={{
            expandedRowRender: (record) => {
              console.log(record)
              return (
                <CustomTable
                  rowKey={record.key}
                  scroll={{ x: 'calc(100vh - 480px)' }}
                  loading={record.lording}
                  columns={renderColumns(record.params)}
                  dataSource={[record.params]}
                />
              )
            },
          }}
        />
      </Drawer>
    </>
  )
};

export default TrainTaskDrawer;