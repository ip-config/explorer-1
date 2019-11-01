// @flow

import React from 'react';
import { Row, Col, Table } from 'reactstrap';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import moment from 'moment';
import { push } from 'connected-react-router';

import HttpDataProvider from 'src/utils/httpProvider';
import TitleIcon from 'src/assets/images/icons/latest-blocks.svg';
import { setBlockData } from 'src/storage/actions/blocks';
import { getBlockUpdateDetails } from 'src/storage/selectors/blocks';
import Wrapper from 'src/views/wrapper/wrapper';

type BlocksProps = {
    setBlocksData: ({ payload: Array<any> }) => void,
    historyPush: (string) => void,
    blockDetails: { allBlockData: Array<{ cursor: string }> },
};

type BlocksState = {
    searchText: string,
    blockData: Array<string>,
    error: string,
    lastFetchedPage: number,
    currentPage: number,
    hasNextPage: boolean,
    currentPageVal: number,
};

class Blocks extends React.Component<BlocksProps, BlocksState> {
    maxPageVal: number = 0

    interval: ?TimeoutID = null

    state = {
        searchText: '',
        blockData: [],
        error: '',
        lastFetchedPage: 2,
        currentPage: 0,
        hasNextPage: true,
        currentPageVal: 0,
    }


    componentDidMount() {
        const { setBlocksData } = this.props;

        this.interval = setTimeout(() => setBlocksData({ payload: [] }), 3000);
    }

    componentWillUnmount() {
        clearTimeout(this.interval);
    }

    /**
     * @method onChangePage() :  Function to handle pagination
     * @param {String} type : Type defines whether it is previous page or next page
     */
    onChangePage = (type: string) => {
        // TODO: code duplicate

        const { currentPageVal } = this.state;
        const { setBlocksData, blockDetails } = this.props;
        const { allBlockData } = blockDetails;
        const updatePageVal = type === 'next' ? currentPageVal + 1 : currentPageVal - 1;

        if (updatePageVal < 0) {
            return;
        }

        const currentBlockDataLength = allBlockData.length;

        if (type === 'next' && updatePageVal * 10 >= currentBlockDataLength) {
            return;
        }

        // ----------------------------------

        this.setState({
            currentPageVal: updatePageVal,
        });
        const cursor = allBlockData[allBlockData.length - 1].cursor;

        if (type === 'next' && this.maxPageVal < updatePageVal) {
            if (true) {
                HttpDataProvider.post('https://graphql.fantom.services/graphql?', {
                    query: `
          {
            blocks(first: 10, byDirection: "desc", after: "${cursor}") {
              pageInfo {
                hasNextPage
              }
              edges {
                cursor,
                node {
                  id,
                  payload
                }
              }
            }
          }`,
                })
                    .then(
                        (res) => {
                            if (res && res.data) {
                                this.maxPageVal = updatePageVal;
                                const allData = res.data;
                                if (
                                    allData.data &&
                                    allData.data.blocks &&
                                    allData.data.blocks.edges &&
                                    allData.data.blocks.edges.length
                                ) {
                                    const blockDetails = {
                                        payload: allData.data.blocks.edges,
                                    };
                                    setBlocksData(blockDetails);
                                    this.setState((prevState) => ({
                                        lastFetchedPage: allData.data.blocks.pageInfo.hasNextPage
                                            ? prevState.lastFetchedPage + 1
                                            : prevState.lastFetchedPage,
                                        hasNextPage: allData.data.blocks.pageInfo.hasNextPage,
                                    }));
                                }
                            }
                            return null;
                        },
                        () => {
                            console.log('1');
                        }
                    )
                    .catch((err) => {
                        console.log(err, 'err in graphql');
                    });
            }
        }
    };

    setSearchText = (e: SyntheticEvent<HTMLInputElement>) => {
        this.setState({
            searchText: e.currentTarget.value,
        });
    }

    /**
     * @method renderBlockList() :  Function to render all list of blocks
     */
    renderBlockList() {
        const { currentPageVal } = this.state;
        const { blockDetails, history } = this.props;
        const { allBlockData } = blockDetails;
        const from = currentPageVal * 10;
        const to = from + 10;
        if (blockDetails && allBlockData) {
            const transformedBlockArray = allBlockData.slice(from, to);

            return (
                <Row>
                    <Col>
                        <Table className="blocks-table">
                            <thead>
                            <tr>
                                <th>Height</th>
                                <th>Time</th>
                                <th>Txn</th>
                                <th>hash</th>
                                <th>Round</th>
                            </tr>
                            </thead>
                            <tbody className="">
                            {transformedBlockArray &&
                            transformedBlockArray.length > 0 &&
                            transformedBlockArray.map((data, index) => (
                                <tr
                                    key={index}
                                    onClick={() =>
                                        history.push({
                                            pathname: `/blocks/${data.height}`,
                                            state: { data, type: 'block' },
                                        })
                                    }
                                >
                                    <td data-head="Height" className="text-primary full head">
                                        <span className="icon icon-block">{data.height}</span>
                                    </td>
                                    <td
                                        data-head="Txn"
                                        className="text-primary full-wrap txn"
                                    >
                                        {moment(new Date(data.createdTime * 1000)).fromNow()}
                                    </td>
                                    <td
                                        data-head="Txn"
                                        className="text-primary full-wrap txn"
                                    >
                                        {data.transactions.length}
                                    </td>
                                    <td
                                        data-head="hash"
                                        className="text-primary full-wrap hash text-ellipsis"
                                    >
                                        {data.hash}
                                    </td>
                                    <td data-head="Round" className=" full-wrap round">
                                        <span className="o-5">{data.round}</span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            );
        }
        return null;
    }

    /**
     * @method onShowList() :  Function to show all list of blocks
     * @param {String} type : Type defines whether it is previous page or next page
     */
    onShowList = () => {
        const { historyPush } = this.props;
        historyPush('/blocks');
    };

    render() {
        const { searchText, currentPageVal } = this.state;
        const { blockDetails, historyPush } = this.props;
        let descriptionBlock = '';
        const from = currentPageVal * 10;
        const to = from + 10;
        let totalBlocks = '';

        if (blockDetails && blockDetails.allBlockData) {
            const transformedBlockArray = blockDetails.allBlockData.slice(from, to);

            const {
                blockDetails: { allBlockData },
            } = this.props;
            if (allBlockData.length) {
                const firstBlock = allBlockData[0];
                totalBlocks = ` (Total of ${firstBlock.height} Blocks)`;
            }

            if (transformedBlockArray && transformedBlockArray.length) {
                const firstBlock = transformedBlockArray[0];
                const lastBlock =
                    transformedBlockArray[transformedBlockArray.length - 1];
                descriptionBlock = `Block #${lastBlock.height} To #${
                    firstBlock.height
                } `;
            }
        }

        return (
            <div>
                <Wrapper
                    setSearchText={this.setSearchText}
                    searchText={searchText}
                    onChangePage={this.onChangePage}
                    icon={TitleIcon}
                    title="Blocks"
                    block={descriptionBlock}
                    total={totalBlocks}
                    onShowList={this.onShowList}
                    currentPage={this.state.currentPageVal}
                    history={historyPush}
                    placeHolder="Search by Transaction Hash / Block Number"
                    pagination
                >
                    {this.state.error ? (
                        <p className="text-white">{this.state.error}</p>
                    ) : (
                        this.renderBlockList()
                    )}
                </Wrapper>
            </div>
        );
    }
}

const mapStateToProps = createSelector(
    getBlockUpdateDetails(),
    (blockDetails) => ({ blockDetails })
);

const mapDispatchToProps = (dispatch) => ({
    setBlocksData: (blockData) => dispatch(setBlockData(blockData)),
    historyPush: (data) => dispatch(push(data)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Blocks);
