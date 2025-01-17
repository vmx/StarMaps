import { Box } from '@chakra-ui/react';

import { group } from 'd3';
import _ from 'lodash';
import React from 'react';

import { getTicks } from '../../lib/client/getTicks';
import { DetailedViewGroup, IssueData } from '../../lib/types';
import { addOffset, formatDateArrayDayJs, getInternalLinkForIssue } from '../../lib/general';
import styles from './Roadmap.module.css';
import { Grid } from './grid';
import { GridHeader } from './grid-header';
import { GridRow } from './grid-row';
import { GroupItem } from './group-item';
import { GroupWrapper } from './group-wrapper';
import Header from './header';
import { Headerline } from './headerline';
import { useViewMode } from '../../hooks/useViewMode';
import { ViewMode } from '../../lib/enums';

export function RoadmapDetailed({ issueData }: { issueData: IssueData; }) {
  const viewMode = useViewMode();
  const showGroupRowTitle = viewMode === ViewMode.Detail;

  const newIssueData = issueData.children.map((v) => ({
    ...v,
    group: v.parent.title,
    children: v.children.map((x) => ({ ...x, group: x.parent.title })),
  }));

  const issueDataLevelOne: IssueData[] = newIssueData.map((v) => v.children.flat()).flat();

  const issueDataLevelOneGrouped: DetailedViewGroup[] = Array.from(
    group(issueDataLevelOne, (d) => d.group),
    ([key, value]) => ({
      groupName: key,
      items: value,
      url: getInternalLinkForIssue(newIssueData.find((i) => i.title === key)),
    }),
  );

  const issueDataLevelOneIfNoChildren: IssueData[] = newIssueData.map((v) => ({ ...v, children: [v], group: v.title }));
  const issueDataLevelOneIfNoChildrenGrouped: DetailedViewGroup[] = Array.from(
    group(issueDataLevelOneIfNoChildren, (d) => d.group),
    ([key, value]) => ({
      groupName: key,
      items: value,
      url: getInternalLinkForIssue(newIssueData.find((i) => i.title === key)),
    }),
  );

  let issuesGrouped: DetailedViewGroup[];
  if (viewMode === ViewMode.Detail) {
    issuesGrouped =
      (!!issueDataLevelOneGrouped && issueDataLevelOneGrouped.length > 0 && issueDataLevelOneGrouped) ||
      issueDataLevelOneIfNoChildrenGrouped;
  } else {
    issuesGrouped = Array.from(
      group(issueData.children as IssueData[], (d) => d.group),
      ([key, value]) => ({
        groupName: key,
        items: value,
        url: getInternalLinkForIssue(newIssueData.find((i) => i.title === key)),
      }),
    );
  }

  const dates = formatDateArrayDayJs(issuesGrouped.map((v) => v.items.map((v) => v.due_date)).flat()).sort((a, b) => {
    return a.getTime() - b.getTime();
  });
  const datesWithOffset = addOffset(dates, { offsetStart: 6, offsetEnd: 3 }).sort((a, b) => {
    return a.getTime() - b.getTime();
  });

  const ticks = getTicks(datesWithOffset, 19);
  const ticksHeader = getTicks(datesWithOffset, 4);

  return (
    <>
      <Box className={styles.timelineBox}>
        <Header issueData={issueData} />
        <Grid ticksLength={ticks.length}>
          {ticksHeader.map((tick, index) => (
            <GridHeader key={index} ticks={tick} index={index} />
          ))}

          <Headerline />
        </Grid>
        <Grid ticksLength={ticks.length} scroll={true}>
          {_.reverse(Array.from(_.sortBy(issuesGrouped, ['groupName']))).map((group, index) => {
            return (
              <GroupWrapper key={index}>
                <GroupItem issueData={issueData} group={group} />
                {!!group.items &&
                  _.sortBy(group.items, ['title']).map((item, index) => {
                    return <GridRow key={index} milestone={item} index={index} timelineTicks={ticksHeader} />;
                  })}
              </GroupWrapper>
            );
          })}
        </Grid>
      </Box>
    </>
  );
}
