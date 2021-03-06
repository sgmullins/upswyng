import { ResourceSchedule, TScheduleItem } from "@upswyng/upswyng-core";

import { RRule } from "rrule";
import React from "react";
import { TResourceScheduleData } from "@upswyng/upswyng-types";
import { font } from "../App.styles";
import styled from "styled-components";

interface ScheduleProps {
  schedule: TResourceScheduleData;
}

const days = {
  sunday: "SU",
  monday: "MO",
  tuesday: "TU",
  wednesday: "WE",
  thursday: "TH",
  friday: "FR",
  saturday: "SA",
};

function capitalize(x: string): string {
  return x.charAt(0).toUpperCase() + x.slice(1);
}

const WeeklyContainer = styled.div`
  display: flex;
`;

const WeeklyDay = styled.h3`
  && {
    flex: 0 1 30%;
    font-size: inherit;
    font-weight: 400;
    margin: 0;
    &::after {
      content: ":";
    }
  }
`;

const WeeklyTimes = styled.p`
  && {
    display: flex;
    flex: 1 1 70%;
    flex-direction: column;
    margin: 0;
  }
`;

const WeeklyTime = styled.span`
  && {
    margin: 0;
    && + && {
      margin-top: ${font.helpers.convertPixelsToRems(4)};
    }
  }
`;

// TODO (rhinodavid): Remove these render functions

// const renderMonthlySchedule = (schedule: TSchedule[]) =>
//   schedule.map(({ day, from, period, to }) => {
//     if (period) {
//       return (
//         <p key={`${period}-${day}-${from}`}>
//           every {period.toLowerCase()} {day} from {from} - {to}
//         </p>
//       );
//     }
//     return null;
//   });

const WeeklySchedule = ({ items }: { items: TScheduleItem[] }) => {
  const dayItemsMap = Object.entries(days).map(([label, key]) => {
    return {
      day: label,
      items: items.filter(
        item =>
          item.recurrenceRule.options.freq === RRule.WEEKLY &&
          item.recurrenceRule.options.byweekday.includes(
            (RRule as any)[key]["weekday"]
          )
      ),
    };
  });

  return (
    <div>
      {dayItemsMap
        .filter(x => x.items.length)
        .map(x => (
          <WeeklyContainer key={x.day}>
            <WeeklyDay>{capitalize(x.day)}</WeeklyDay>
            <WeeklyTimes>
              {x.items.map(i => (
                <WeeklyTime key={`${i.fromTime.value}${i.toTime.value}`}>
                  {i.fromTime.label} - {i.toTime.label}
                </WeeklyTime>
              ))}
            </WeeklyTimes>
          </WeeklyContainer>
        ))}
    </div>
  );
};

const Schedule = ({ schedule }: ScheduleProps) => {
  try {
    const resourceSchedule = ResourceSchedule.parse(schedule);

    // group together schedule items that have the same comments
    const commentMap = resourceSchedule.getItems().reduce((result, item) => {
      const comment = item.comment || "_no_comment_";
      result[comment as keyof typeof days] = [
        ...(result[comment as keyof typeof days] || []),
        item,
      ];
      return result;
    }, {} as Record<keyof typeof days, TScheduleItem[]>);

    return (
      <div>
        {Object.entries(commentMap).map(([comment, items]) => (
          <div key={comment}>
            <WeeklySchedule items={items as TScheduleItem[]} />
            {comment !== "_no_comment_" && <div>{comment}</div>}
          </div>
        ))}
      </div>
    );
  } catch {
    return <p>not available</p>;
  }
};

export default Schedule;
