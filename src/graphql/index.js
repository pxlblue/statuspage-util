const moment = require('moment'),
  fetch = require('node-fetch').default,
  util = require('util')

const LATENCY_QUERY = `query ActivityLogQuery($zoneTag: string, $filter: HealthCheckEventsByGroupsFilter_InputObject, $activityFilter: HealthCheckEventsFilter_InputObject, $limit: int64!) {
  viewer {
    zones(filter: {zoneTag: $zoneTag}) {
      total: healthCheckEventsAdaptiveGroups(limit: 1, filter: $filter) {
        count
        __typename
      }
      activity: healthCheckEventsAdaptive(filter: $activityFilter, limit: $limit, orderBy: [datetime_DESC, healthCheckId_DESC, scope_DESC]) {
        sampleInterval
        datetime
        failureReason
        fqdn
        healthChanged
        healthCheckId
        healthCheckName
        healthStatus
        originIP
        originResponseStatus
        expectedResponseCodes
        region
        tcpConnMs
        tlsHandshakeMs
        timeToFirstByteMs
        rttMs
        scope
        __typename
      }
      __typename
    }
    __typename
  }
}`

async function getGraphQLData(zoneId) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName: 'getOrderedHealthchecks',
      query: LATENCY_QUERY,
      variables: {
        zoneTag: zoneId,
        limit: 25,

        activityFilter: {
          AND: [
            {
              datetime_leq: moment().toISOString(),
              datetime_geq: moment().subtract(1, 'day').toISOString(),
              region: 'GLOBAL',
              fqdn: 'api.pxl.blue',
            },
          ],
        },
        filter: {
          AND: [
            {
              datetime_leq: moment().toISOString(),
              datetime_geq: moment().subtract(1, 'day').toISOString(),
            },
          ],
        },
      },
    }),
  })
  const json = await res.json()
  return json.data.viewer.zones[0]
}

/**
 * Gets latency
 * @param {string} zoneId - Zone ID
 * @returns {number} Latency
 */
module.exports.getLatency = async function getLatency(zoneId) {
  let data = await getGraphQLData(zoneId)
  return data.activity
}
