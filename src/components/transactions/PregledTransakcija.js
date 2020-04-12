import React, { Component } from "react";
import ReactDOM from "react-dom";
import "antd/dist/antd.css";
import { Table, Input, Button, Tag, Typography, Row, Col } from "antd";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";
import { getToken } from "../../utilities/Common";
import axios from "axios";
import uuid from "react-uuid";
import "../../css/Transactions.css";

import numeral from "numeral";
import Slider from "antd/lib/slider";

const { Text } = Typography;

class PregledTransakcija extends Component {
  state = {
    searchText: "",
    searchedColumn: "",
    data: [],
    key: 0,
    expandedKeys: [],
    maxPrice: 0,
    left: 0,
    right: 0
  };

  load = (response) => {
    const transactions = [];
    response.data.forEach((transaction) => {
      transactions.push({
        key: transaction.transactionId,
        cardNumber: transaction.cardNumber,
        merchantName: transaction.merchantName,
        totalPrice: transaction.totalPrice,
        date: transaction.date.substr(0, 10),
        time: transaction.date.substr(11, 8),
        service: transaction.service,
      });
    });
    this.setState({ data: transactions }, () => {
      console.log(this.state.data);
    });
    let maxP = 0;
    for (let i = 0; i < this.state.data.length; i++) {
      if (parseFloat(this.state.data[i].totalPrice) > maxP) {
        maxP = parseFloat(this.state.data[i].totalPrice);
      }
    }
    this.setState({ maxPrice: maxP }, () => {
      console.log(this.state.maxPrice);
    });
  };

  componentWillMount() {
    this.getTransactions();
  }

  getTransactions() {
    axios
      .get("https://payment-server-si.herokuapp.com/api/transactions/all", {
        headers: { Authorization: "Bearer " + getToken() },
      })
      .then(this.load)
      .catch((err) => console.log(err));
  }

  getTransactionsByService = (selectedKeys) => {
    axios
      .get(
        "https://payment-server-si.herokuapp.com/api/transactions/service/" +
        selectedKeys,
        {
          headers: { Authorization: "Bearer " + getToken() },
        }
      )
      .then(this.load)
      .catch((err) => console.log(err));
  };

  getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
        <div style={{ padding: 8 }}>
          <Input
            ref={(node) => {
              this.searchInput = node;
            }}
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() =>
              this.handleSearch(selectedKeys, confirm, dataIndex)
            }
            style={{ width: 188, marginBottom: 8, display: "block" }}
          />
          <Button
            type="primary"
            onClick={() => {
              dataIndex !== "service"
                ? this.handleSearch(selectedKeys, confirm, dataIndex)
                : this.getTransactionsByService(selectedKeys);
            }}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Search
        </Button>
          <Button
            onClick={() => {
              dataIndex !== "service"
                ? this.handleReset(clearFilters)
                : this.getTransactions();
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
        </Button>
        </div>
      ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: (text) =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text.toString()}
        />
      ) : (
          text
        ),
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = (clearFilters) => {
    clearFilters();
    this.setState({
      searchText: "",
    });
  };

  handleSearchPrice = (selectedKeys, confirm, dataIndex) => {
    console.log(selectedKeys);
    confirm();
    this.setState({
      searchText: [selectedKeys[0], selectedKeys[1]],

      searchedColumn: dataIndex,
    });
  };

  onTableRowExpand(expanded, record) {
    var keys = [];
    if (expanded) {
      keys.push(record.key);
    }

    this.setState({ expandedKeys: keys });
  }

  expandedRowRender = (rowData) => {
    const service = rowData.service;
    const columns = [
      { title: "Item", dataIndex: "item", key: "item" },
      { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    ];

    const items = service.split(",");
    const collapsedData = [];

    for (let i = 0; i < items.length; ++i) {
      let itemData = items[i].split("(");
      collapsedData.push({
        key: i,
        item: itemData[0],
        quantity: itemData[1].substr(0, itemData[1].length - 1),
      });
    }
    return (
      <Table columns={columns} dataSource={collapsedData} pagination={false} />
    );
  };

  getPriceSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
        <div
          className="price-filter"
          style={{ minWidth: "20rem", padding: "0.5rem 1rem" }}
        >
          <Row>
            <Col span={4}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div>
                  <strong>Min:</strong>
                </div>
                <div>{numeral(0).format("0.0a")} <br></br> {"KM"} </div>
              </div>
            </Col>
            <Col span={16}>
              <Slider
                range
                value={[0, parseFloat(this.state.maxPrice)]}
                tipFormatter={value => {
                  return numeral(value).format("0.0a");
                }}
                step='0.1'
                onChange={e => this.setState({ left: e[0], right: e[1] })}
              />
            </Col>
            <Col span={4}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div>
                  <strong>Max:</strong>
                </div>
                <div>{numeral(this.state.maxPrice).format("0.0a")}  <br></br> {"KM"}</div>
              </div>
            </Col>
          </Row>
          <Row>
            <Button
              type="primary"
              block
              size="small"
              onClick={() => {
                confirm();
              }}
            >
              Confirm
      </Button>
            <Button
              onClick={() => {
                this.getTransactions();
                clearFilters();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Row>
        </div>
      )
  });


  render() {
    let things = {};
    things.thing = [];

    for (let i = 0; i < this.state.data.length; i++) {
      things.thing.push({
        text: this.state.data[i].cardNumber,
        value: this.state.data[i].cardNumber,
      });
    }

    // Remove duplicate card numbers
    things.thing = things.thing.filter(
      (thing, index, self) =>
        index ===
        self.findIndex((t) => t.text === thing.text && t.value === thing.value)
    );

    // price slider
    // slider props


    // find max price
    let maxPrice = 0;
    for (let i = 0; i < this.state.data.length; i++) {
      if (parseFloat(this.state.data[i].totalPrice) > maxPrice) {
        maxPrice = parseFloat(this.state.data[i].totalPrice);
      }
    }

    const sliderProps = {
      range: true,
      min: 0,
      max: parseFloat(maxPrice),
      tipFormatter: value => {
        return numeral(value).format("0.0a");
      },
      step: '0.1'
    };

    /*const formattedMin = numeral(0).format("0.0a");
    const formattedMax = numeral(maxPrice).format("0.0a");
    const slider = (
      <div
        className="price-filter"
        style={{ minWidth: "20rem", padding: "0.5rem 1rem" }}
      >
        <Row>
          <Col span={4}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <strong>Min:</strong>
              </div>
              <div>{formattedMin} <br></br> {"KM"} </div>
            </div>
          </Col>
          <Col span={16}>
            <Slider {...sliderProps} />
          </Col>
          <Col span={4}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <strong>Max:</strong>
              </div>
              <div>{formattedMax}  <br></br> {"KM"}</div>
            </div>
          </Col>
        </Row>
      </div>
    );*/


    const columns = [
      {
        title: "Card number",
        dataIndex: "cardNumber",
        key: "cardNumber",
        width: "30%",
        sorter: (a, b) => a.cardNumber - b.cardNumber,
        defaultSortOrder: "ascend",
        filters: things.thing,
        onFilter: (value, record) => record.cardNumber.indexOf(value) === 0,
      },
      {
        title: "Merchant",
        dataIndex: "merchantName",
        key: "merchantName",
        width: "20%",
        sorter: (a, b) => {
          return a.merchantName.localeCompare(b.merchantName);
        },
        ...this.getColumnSearchProps("merchantName"),
      },
      {
        title: "Service",
        dataIndex: "service",
        key: "service",
        ellipsis: true,
        ...this.getColumnSearchProps("service"),
      },
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
        sorter: (a, b) => {
          return a.date.localeCompare(b.date);
        },
        filters: [
          {
            text: "24 hours",
            value: "24h",
          },
          {
            text: "Last month",
            value: "month",
          },
          {
            text: "Last year",
            value: "year",
          },
        ],
        onFilter: (value, record) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1
          );
          const monthAgo = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            today.getDate()
          );
          const yearAgo = new Date(
            today.getFullYear() - 1,
            today.getMonth(),
            today.getDate()
          );

          const day = parseInt(record.date.substr(8, 10));
          const month = parseInt(record.date.substr(5, 7)) - 1;
          const year = parseInt(record.date.substr(0, 4));
          const date = new Date(year, month, day);

          if (value === "24h") {
            console.log(today + " " + date);
            return (
              date.getTime() === today.getTime() ||
              date.getTime() === yesterday.getTime()
            );
          } else if (value == "month") return monthAgo <= date && date <= today;
          return yearAgo <= date && date <= today;
        },
      },
      {
        title: "Value",
        dataIndex: "totalPrice",
        key: "totalPrice",
        sorter: (a, b) => a.totalPrice - b.totalPrice,
        render: (price) => (
          <Tag id="tagIznosa" color="red">
            {price} KM
          </Tag>
        ),
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
            <div
              className="price-filter"
              style={{ minWidth: "20rem", padding: "0.5rem 1rem" }}
            >
              <Row>
                <Col span={4}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div>
                      <strong>Min:</strong>
                    </div>
                    <div>{numeral(0).format("0.0a")} <br></br> {"KM"} </div>
                  </div>
                </Col>
                <Col span={16}>
                  <Slider {...sliderProps} />
                </Col>
                <Col span={4}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div>
                      <strong>Max:</strong>
                    </div>
                    <div>{numeral(this.state.maxPrice).format("0.0a")}  <br></br> {"KM"}</div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Button
                  type="primary"
                  block
                  size="small"
                  onClick={() => {
                    confirm();
                  }}
                >
                  Confirm
                </Button>
                </Row>
            </div>
          ),
        onFilter: (values, record) => {
          return (parseFloat(values[0]) <= parseFloat(record.totalPrice) && parseFloat(record.totalPrice) <= parseFloat(values[1]));
        }
      },
    ];
    return (
      <Table
        columns={columns}
        dataSource={this.state.data}
        onExpand={(expanded, render) => this.onTableRowExpand(expanded, render)}
        expandable={{
          expandedRowRender: (record) => this.expandedRowRender(record),
        }}
        expandedRowKeys={this.state.expandedKeys}
        summary={(pageData) => {
          let total = 0;
          pageData.forEach(({ totalPrice }) => {
            total += totalPrice;
          });
          return (
            <>
              <tr>
                <td></td>
                <th>Total</th>
                <td></td>
                <td></td>
                <td></td>
                <td id="totalSum">
                  <Text strong>{total.toFixed(3)} KM</Text>
                </td>
              </tr>
            </>
          );
        }}
      />
    );
  }
}

export default PregledTransakcija;
