'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import sideMenuStyle from './index.module.scss';
import { Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons';
import Icon from '@/components/icon';
import { useRouter } from 'next/navigation';
import { AnomalyTrainData } from '@/types';
import EllipsisWithTooltip from '@/components/ellipsis-with-tooltip';

const Aside = ({ children, menuItems, loading, isChange }: { children: any, menuItems: AnomalyTrainData[], loading: boolean, isChange: boolean }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const folder_id = searchParams.get('folder_id') || '';
  const folder_name = searchParams.get('folder_name') || '';
  const router = useRouter();

  const buildUrlWithParams = (id: number) => {
    return `?id=${id}&folder_id=${folder_id}&folder_name=${folder_name}`;
  };

  const isActive = (id: number): boolean => {
    if (pathname === null) return false;
    return searchParams.get('id') === id.toString();
  };

  const goBack = (e: any) => {
    e.preventDefault();
    if (isChange) {
      const shouldSave = window.confirm('请确认数据已保存，是否继续？');
      if (shouldSave) {
        router.replace(`/dataset/manage/detail?folder_id=${folder_id}&folder_name=${folder_name}`);
      }
    } else {
      router.replace(`/dataset/manage/detail?folder_id=${folder_id}&folder_name=${folder_name}`);
    }
  };

  return (
    <>
      <aside className={`w-[216px] pr-4 flex flex-shrink-0 flex-col h-full ${sideMenuStyle.sideMenu} font-sans`}>
        <div className={`p-4 rounded-md mb-3 h-[90px] ${sideMenuStyle.introduction}`}>
          <div className="font-bold text-base text-gray-800">{children}</div>
        </div>
        <nav className={`flex-1 relative rounded-md ${sideMenuStyle.nav}`}>
          {loading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <Spin spinning={loading}></Spin>
            </div>
          ) : (
            <ul className="p-3 overflow-auto max-h-[65vh]">
              {menuItems.map((item: any) => (
                <li
                  key={item.id}
                  className={`rounded-md mb-1 transition-all duration-150 ${isActive(item.id)
                    ? `${sideMenuStyle.active} font-semibold bg-blue-50 text-blue-600`
                    : 'font-normal text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Link
                    href={buildUrlWithParams(item.id)}
                    className="group flex items-center overflow-hidden h-9 rounded-md py-2 text-[15px] px-3"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (isChange) {
                        const shouldSave = window.confirm('请确认数据已保存，是否继续？');
                        if (shouldSave) {
                          router.push(buildUrlWithParams(item.id));
                        }
                      } else {
                        router.push(buildUrlWithParams(item.id));
                      }
                    }}
                  >
                    <Icon type={'chakanshuji'} className="text-xl pr-1.5" />
                    <EllipsisWithTooltip
                      text={item.name}
                      className={`w-[100px] overflow-hidden text-ellipsis whitespace-nowrap ${isActive(item.id) ? 'font-semibold' : 'font-normal'}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            className="absolute bottom-4 left-4 flex items-center content-center py-2 px-4 rounded-md text-sm font-medium text-gray-600 cursor-pointer hover:text-blue-600"
            onClick={goBack}
          >
            <ArrowLeftOutlined className="mr-2" />
          </button>
        </nav>
      </aside>
    </>
  )
};

export default Aside;