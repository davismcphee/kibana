/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { UserAtSpaceScenarios } from '../../../scenarios';
import { getUrlPrefix, getTestRuleData, ObjectRemover, getEventLog } from '../../../../common/lib';
import type { FtrProviderContext } from '../../../../common/ftr_provider_context';

export default function getGlobalExecutionKpiTests({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const supertestWithoutAuth = getService('supertestWithoutAuth');

  const retry = getService('retry');

  describe('getGlobalExecutionKpi', () => {
    const objectRemover = new ObjectRemover(supertest);

    afterEach(() => objectRemover.removeAll());

    it('should return KPI only from the current space', async () => {
      const startTime = new Date().toISOString();

      const spaceId = UserAtSpaceScenarios[1].space.id;
      const user = UserAtSpaceScenarios[1].user;
      const response = await supertest
        .post(`${getUrlPrefix(spaceId)}/api/alerting/rule`)
        .set('kbn-xsrf', 'foo')
        .send(
          getTestRuleData({
            rule_type_id: 'test.noop',
            schedule: { interval: '1s' },
            throttle: null,
          })
        );

      expect(response.status).to.eql(200);
      const ruleId = response.body.id;
      objectRemover.add(spaceId, ruleId, 'rule', 'alerting');

      const spaceId2 = UserAtSpaceScenarios[4].space.id;
      const response2 = await supertest
        .post(`${getUrlPrefix(spaceId2)}/api/alerting/rule`)
        .set('kbn-xsrf', 'foo')
        .send(
          getTestRuleData({
            rule_type_id: 'test.noop',
            schedule: { interval: '1s' },
            throttle: null,
          })
        );

      expect(response2.status).to.eql(200);
      const ruleId2 = response2.body.id;
      objectRemover.add(spaceId2, ruleId2, 'rule', 'alerting');

      await retry.try(async () => {
        // break AAD
        await supertest
          .put(`${getUrlPrefix(spaceId2)}/api/alerts_fixture/saved_object/alert/${ruleId2}`)
          .set('kbn-xsrf', 'foo')
          .send({
            attributes: {
              name: 'bar',
            },
          })
          .expect(200);
      });

      await retry.try(async () => {
        // there can be a successful execute before the error one
        const someEvents = await getEventLog({
          getService,
          spaceId: spaceId2,
          type: 'alert',
          id: ruleId2,
          provider: 'alerting',
          actions: new Map([['execute', { gte: 1 }]]),
        });
        const errorEvents = someEvents.filter(
          (event) => event?.kibana?.alerting?.status === 'error'
        );
        expect(errorEvents.length).to.be.above(0);
      });

      await retry.try(async () => {
        // there can be a successful execute before the error one
        const logResponse = await supertestWithoutAuth
          .get(
            `${getUrlPrefix(
              spaceId
            )}/internal/alerting/_global_execution_logs?date_start=${startTime}&date_end=9999-12-31T23:59:59Z&per_page=50&page=1`
          )
          .set('kbn-xsrf', 'foo')
          .auth(user.username, user.password);
        expect(logResponse.statusCode).to.be(200);
        expect(logResponse.body.data.length).to.be.above(1);
      });

      await retry.try(async () => {
        // break AAD
        await supertest
          .put(`${getUrlPrefix(spaceId)}/api/alerts_fixture/saved_object/alert/${ruleId}`)
          .set('kbn-xsrf', 'foo')
          .send({
            attributes: {
              name: 'bar',
            },
          })
          .expect(200);
      });

      await retry.try(async () => {
        // there can be a successful execute before the error one
        const someEvents = await getEventLog({
          getService,
          spaceId,
          type: 'alert',
          id: ruleId,
          provider: 'alerting',
          actions: new Map([['execute', { gte: 1 }]]),
        });
        const errorEvents = someEvents.filter(
          (event) => event?.kibana?.alerting?.status === 'error'
        );
        expect(errorEvents.length).to.be.above(0);
      });

      const kpiLogs = await retry.try(async () => {
        // there can be a successful execute before the error one
        const logResponse = await supertestWithoutAuth
          .get(
            `${getUrlPrefix(
              spaceId
            )}/internal/alerting/_global_execution_kpi?date_start=${startTime}&date_end=9999-12-31T23:59:59Z`
          )
          .set('kbn-xsrf', 'foo')
          .auth(user.username, user.password);
        expect(logResponse.statusCode).to.be(200);

        return logResponse.body;
      });

      expect(Object.keys(kpiLogs)).to.eql([
        'success',
        'unknown',
        'failure',
        'warning',
        'activeAlerts',
        'newAlerts',
        'recoveredAlerts',
        'erroredActions',
        'triggeredActions',
      ]);
      expect(kpiLogs.success).to.be.above(1);
      expect(kpiLogs.failure).to.be.above(0);
    });

    it('should return KPI from all spaces in the namespaces param', async () => {
      const startTime = new Date().toISOString();

      const spaceId = UserAtSpaceScenarios[1].space.id;
      const user = UserAtSpaceScenarios[1].user;
      const response = await supertest
        .post(`${getUrlPrefix(spaceId)}/api/alerting/rule`)
        .set('kbn-xsrf', 'foo')
        .send(
          getTestRuleData({
            rule_type_id: 'test.noop',
            schedule: { interval: '1s' },
            throttle: null,
          })
        );

      expect(response.status).to.eql(200);
      const ruleId = response.body.id;
      objectRemover.add(spaceId, ruleId, 'rule', 'alerting');

      const spaceId2 = UserAtSpaceScenarios[4].space.id;
      const response2 = await supertest
        .post(`${getUrlPrefix(spaceId2)}/api/alerting/rule`)
        .set('kbn-xsrf', 'foo')
        .send(
          getTestRuleData({
            rule_type_id: 'test.noop',
            schedule: { interval: '1s' },
            throttle: null,
          })
        );

      expect(response2.status).to.eql(200);
      const ruleId2 = response2.body.id;
      objectRemover.add(spaceId2, ruleId2, 'rule', 'alerting');

      await retry.try(async () => {
        // break AAD
        await supertest
          .put(`${getUrlPrefix(spaceId2)}/api/alerts_fixture/saved_object/alert/${ruleId2}`)
          .set('kbn-xsrf', 'foo')
          .send({
            attributes: {
              name: 'bar',
            },
          })
          .expect(200);
      });

      await retry.try(async () => {
        // there can be a successful execute before the error one
        const someEvents = await getEventLog({
          getService,
          spaceId: spaceId2,
          type: 'alert',
          id: ruleId2,
          provider: 'alerting',
          actions: new Map([['execute', { gte: 1 }]]),
        });
        const errorEvents = someEvents.filter(
          (event) => event?.kibana?.alerting?.status === 'error'
        );
        expect(errorEvents.length).to.be.above(0);
      });

      await retry.try(async () => {
        // there can be a successful execute before the error one
        const logResponse = await supertestWithoutAuth
          .get(
            `${getUrlPrefix(
              spaceId
            )}/internal/alerting/_global_execution_logs?date_start=${startTime}&date_end=9999-12-31T23:59:59Z&per_page=50&page=1`
          )
          .set('kbn-xsrf', 'foo')
          .auth(user.username, user.password);
        expect(logResponse.statusCode).to.be(200);
        expect(logResponse.body.data.length).to.be.above(1);
      });

      await retry.try(async () => {
        // break AAD
        await supertest
          .put(`${getUrlPrefix(spaceId)}/api/alerts_fixture/saved_object/alert/${ruleId}`)
          .set('kbn-xsrf', 'foo')
          .send({
            attributes: {
              name: 'bar',
            },
          })
          .expect(200);
      });

      await retry.try(async () => {
        // there can be a successful execute before the error one
        const someEvents = await getEventLog({
          getService,
          spaceId,
          type: 'alert',
          id: ruleId,
          provider: 'alerting',
          actions: new Map([['execute', { gte: 1 }]]),
        });
        const errorEvents = someEvents.filter(
          (event) => event?.kibana?.alerting?.status === 'error'
        );
        expect(errorEvents.length).to.be.above(0);
      });

      const kpiLogs = await retry.try(async () => {
        // there can be a successful execute before the error one
        const logResponse = await supertestWithoutAuth
          .get(
            `${getUrlPrefix(
              spaceId
            )}/internal/alerting/_global_execution_kpi?date_start=${startTime}&date_end=9999-12-31T23:59:59Z&namespaces=${JSON.stringify(
              [spaceId, spaceId2]
            )}`
          )
          .set('kbn-xsrf', 'foo')
          .auth(user.username, user.password);
        expect(logResponse.statusCode).to.be(200);

        return logResponse.body;
      });

      expect(Object.keys(kpiLogs)).to.eql([
        'success',
        'unknown',
        'failure',
        'warning',
        'activeAlerts',
        'newAlerts',
        'recoveredAlerts',
        'erroredActions',
        'triggeredActions',
      ]);
      expect(kpiLogs.success).to.be.above(1);
      expect(kpiLogs.failure).to.be.above(1);
    });
  });
}
